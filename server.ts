import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import bodyParser from "body-parser";
import baileys, { 
    DisconnectReason, 
    useMultiFileAuthState, 
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore
} from "@whiskeysockets/baileys";
import qrcodeTerminal from "qrcode-terminal";
import QRCode from "qrcode";
import pino from "pino";
import fs from "fs";


const logger = pino({ level: 'info' });

// --- Orders Persistence Store ---
const ORDERS_FILE = path.join(process.cwd(), 'data', 'orders.json');

function ensureDataDir() {
    const dir = path.dirname(ORDERS_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(ORDERS_FILE)) {
        fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
}

function loadOrders(): any[] {
    try {
        ensureDataDir();
        const content = fs.readFileSync(ORDERS_FILE, 'utf-8');
        return JSON.parse(content);
    } catch (e) {
        console.error("Error loading orders from disk:", e);
        return [];
    }
}

function saveOrders(orders: any[]) {
    try {
        ensureDataDir();
        fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf-8');
    } catch (e) {
        console.error("Error saving orders to disk:", e);
    }
}

// --- App Configuration Store ---
const CONFIG_FILE = path.join(process.cwd(), 'data', 'config.json');

function getStoredConfig(): { receptionistNumber?: string } {
    try {
        ensureDataDir();
        if (fs.existsSync(CONFIG_FILE)) {
            return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
        }
    } catch (e) {
        console.warn("Could not read config file:", e);
    }
    return {};
}

function saveStoredConfig(newConf: { receptionistNumber?: string }) {
    try {
        ensureDataDir();
        const current = getStoredConfig();
        const merged = { ...current, ...newConf };
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2), 'utf-8');
    } catch (e) {
        console.warn("Could not save config file:", e);
    }
}

let sock: any;
let currentQR: string | null = null;
let isConnected = false;
let whatsappRetryCount = 0;
let isConflictState = false;
let whatsappRetryTimeout: NodeJS.Timeout | null = null;

function triggerWhatsAppReconnect(delayMs: number) {
    if (whatsappRetryTimeout) {
        clearTimeout(whatsappRetryTimeout);
    }
    whatsappRetryTimeout = setTimeout(() => {
        connectToWhatsApp();
    }, delayMs);
}

function clearAuthCreds() {
    try {
        console.log("Cleaning up WhatsApp session credentials directory...");
        if (fs.existsSync('auth_info_baileys')) {
            fs.rmSync('auth_info_baileys', { recursive: true, force: true });
            console.log("WhatsApp credentials cleared successfully.");
        }
    } catch (err: any) {
        console.error("Error clearing authenticating details:", err.message);
    }
}

async function connectToWhatsApp() {
    // Clear any pending reconnect timeouts immediately to prevent parallel connection loops
    if (whatsappRetryTimeout) {
        clearTimeout(whatsappRetryTimeout);
        whatsappRetryTimeout = null;
    }

    // 1. Clean up old socket connection and its event listeners to avoid memory leaks/locks
    if (sock) {
        console.log("Cleaning up previous WhatsApp socket connection...");
        try {
            sock.ev.removeAllListeners('connection.update');
            sock.ev.removeAllListeners('creds.update');
            
            // Physically close the WebSocket connection if active
            if (sock.ws && typeof sock.ws.close === 'function') {
                try {
                    sock.ws.close();
                } catch (wsErr) {}
            }
            if (typeof sock.end === 'function') {
                sock.end(undefined);
            }
        } catch (e: any) {
            console.log("Note: error while closing old socket (expected if already closed):", e.message);
        }
        sock = null;
    }

    // 2. Fetch latest version safely
    let version: any = [2, 3000, 1015948301]; // Safe stable fallback version
    let isLatest = false;
    try {
        const result = await fetchLatestBaileysVersion();
        version = result.version;
        isLatest = result.isLatest;
        console.log(`Successfully fetched latest WA v${version.join('.')}, isLatest: ${isLatest}`);
    } catch (e: any) {
        console.warn(`⚠️ Failed to fetch latest WA version (likely network issue), using fallback v2.3000.1015948301:`, e.message);
    }

    // 3. Initialize authentication state
    let state, saveCreds;
    try {
        const authState = await useMultiFileAuthState('auth_info_baileys');
        state = authState.state;
        saveCreds = authState.saveCreds;
    } catch (authError: any) {
        console.error("🔥 Error initializing WhatsApp authentication state. Clearing credentials and retrying...", authError.message);
        clearAuthCreds();
        // Retry safely
        triggerWhatsAppReconnect(3000);
        return;
    }

    // 4. Create brand new WhatsApp socket instance
    try {
        const createSocket = typeof baileys === 'function' 
            ? baileys 
            : ((baileys as any)?.default || (baileys as any)?.makeWASocket || makeCacheableSignalKeyStore);
        sock = (createSocket as any)({
            version,
            logger: pino({ level: 'silent' }),
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, logger),
            },
        });
    } catch (err: any) {
        console.error("🔥 Critical error executing makeWASocket:", err.message);
        triggerWhatsAppReconnect(5000);
        return;
    }

    // 5. Wire up socket lifecycle event handlers
    sock.ev.on('connection.update', async (update: any) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            currentQR = qr;
            console.log('Scan the QR code below to connect WhatsApp:');
            qrcodeTerminal.generate(qr, { small: true });
        }
        if (connection === 'close') {
            isConnected = false;
            
            // Extract Baileys disconnect reason
            const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
            const errorMsg = lastDisconnect?.error?.message || "";
            console.log(`[WhatsApp] Connection closed. Status Code: ${statusCode || 'unknown'}. Error detail:`, lastDisconnect?.error);
 
            const isConflict = statusCode === 440 || 
                               statusCode === 409 || 
                               errorMsg.includes("conflict") || 
                               errorMsg.includes("Stream Errored (conflict)");

            const isSessionInvalid = statusCode === DisconnectReason.loggedOut || 
                                     statusCode === 401 || 
                                     statusCode === 403 ||
                                     errorMsg.includes("logged out") ||
                                     errorMsg.includes("unauthorized");

            const isQRExpired = statusCode === 408 || 
                                statusCode === 504 || 
                                errorMsg.includes("QR refs attempts ended") || 
                                errorMsg.includes("rate-overlimit");

            if (isSessionInvalid) {
                console.log("[WhatsApp] Authentication state is invalid or expired. Resetting session credentials...");
                clearAuthCreds();
                currentQR = null;
                whatsappRetryCount = 0;
                isConflictState = false;
                // Auto-start fresh to fetch a new QR code for the administrator
                triggerWhatsAppReconnect(3000);
            } else if (isQRExpired) {
                console.log("[WhatsApp] QR code expired or scan attempts ended (408/504). Clearing expired QR and initiating a fresh socket to request a new QR...");
                currentQR = null;
                // Instantly trigger a fresh socket connection to generate a new QR immediately
                triggerWhatsAppReconnect(1000);
            } else if (isConflict) {
                isConflictState = true;
                whatsappRetryCount++;
                console.warn(`[WhatsApp] Stream/session conflict (440). Attempt ${whatsappRetryCount}.`);
                if (whatsappRetryCount >= 5) {
                    console.warn("[WhatsApp] Multiple conflicts detected. Retrying with a longer 60s cooldown to allow the previous session on WhatsApp servers to clear...");
                    triggerWhatsAppReconnect(60000);
                } else {
                    console.log("[WhatsApp] Attempting reconnection with a 15s backoff delay...");
                    triggerWhatsAppReconnect(15000);
                }
            } else {
                // For other transient conditions like 515 (stream error), 503 (service unavailable), 408 (timeout), etc.
                console.log("[WhatsApp] Transient connection close. Attempting auto-reconnection in 5 seconds...");
                triggerWhatsAppReconnect(5000);
            }
        } else if (connection === 'open') {
            isConnected = true;
            currentQR = null;
            whatsappRetryCount = 0;
            isConflictState = false;
            console.log('✅ WhatsApp connection opened and authenticated successfully!');
        }
    });

    sock.ev.on('creds.update', saveCreds);
}

// Graceful process exit setup to instantly release WhatsApp's WS connection slot on restarts
const gracefulShutdown = () => {
    console.log("[WhatsApp] Gracefully closing and releasing active connections...");
    if (sock) {
        try {
            sock.ev.removeAllListeners('connection.update');
            sock.ev.removeAllListeners('creds.update');
            if (sock.ws && typeof sock.ws.close === 'function') {
                sock.ws.close();
            }
            if (typeof sock.end === 'function') {
                sock.end(undefined);
            }
        } catch (e: any) {
            console.log("[WhatsApp] Error during socket closing handlers:", e.message);
        }
    }
    process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

process.on('unhandledRejection', (reason, promise) => {
    console.warn('[Server] Unhandled promise rejection guarded:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('[Server] Uncaught exception guarded:', err);
});

async function startServer() {
    const app = express();
    const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

    app.use(bodyParser.json());

    // Initialize WhatsApp asynchronously in background
    connectToWhatsApp().catch((err: any) => {
        console.error("Initial WhatsApp connection error:", err?.message || err);
    });

    // --- API Routes ---
    const verifyAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
        const providedKey = req.query.key || req.headers['x-admin-key'];
        const secureKey = process.env.SECURE_KEY || "diegosas";
        if (providedKey === secureKey) {
            next();
        } else {
            res.status(401).json({ error: "Unauthorized" });
        }
    };

    app.get("/api/verify-admin-key", (req, res) => {
        const providedKey = req.query.key;
        const secureKey = process.env.SECURE_KEY || "diegosas";
        if (providedKey && providedKey === secureKey) {
            res.json({ valid: true });
        } else {
            res.json({ valid: false });
        }
    });

    app.get("/api/whatsapp-status", verifyAdmin, (req, res) => {
        res.json({ 
            isConnected, 
            hasQR: !!currentQR,
            whatsappRetryCount,
            isConflictState
        });
    });

    app.post("/api/whatsapp-reset", verifyAdmin, (req, res) => {
        console.log("[WhatsApp] Manual session reset requested by administrator.");
        clearAuthCreds();
        currentQR = null;
        isConnected = false;
        whatsappRetryCount = 0;
        isConflictState = false;
        
        // Reconnect after brief delay safely, clearing any parallel tasks
        triggerWhatsAppReconnect(1000);
        res.json({ success: true, message: "WhatsApp state cleared and connection restarting..." });
    });

    app.get("/api/whatsapp-qr", verifyAdmin, async (req, res) => {
        if (!currentQR) {
            return res.status(404).json({ error: "No QR code available" });
        }
        try {
            const qrDataURL = await QRCode.toDataURL(currentQR);
            res.json({ qrDataURL, qr: qrDataURL });
        } catch (err) {
            res.status(500).json({ error: "Failed to generate QR code image" });
        }
    });

    app.post("/api/whatsapp-test", verifyAdmin, async (req, res) => {
        if (!sock || !isConnected) {
            return res.status(400).json({ error: "WhatsApp is not connected yet" });
        }
        try {
            const conf = getStoredConfig();
            const rawNumbers = conf.receptionistNumber || process.env.RECEPTIONIST_NUMBER || "695591420";
            const recipients = rawNumbers.split(/[,; ]+/).map(n => formatCameroonPhone(n)).filter(n => n.length >= 9);
            const target = recipients[0] || "237695591420";
            const jid = `${target}@s.whatsapp.net`;
            await sock.sendMessage(jid, {
                text: `🔔 *Test de Connexion Diego SAS* : Le compte WhatsApp de la réception est bien relié au système. Les alertes de nouvelles commandes seront transmises ici en temps réel !`
            });
            res.json({ success: true, message: `Message de test envoyé avec succès à ${target}` });
        } catch (e: any) {
            console.error("Test WhatsApp message failed:", e.message);
            res.status(500).json({ error: e.message || "Failed to send test message" });
        }
    });

    function formatCameroonPhone(phone: string): string {
        let clean = (phone || '').replace(/[^0-9]/g, '');
        if (clean.startsWith('00237')) clean = clean.slice(5);
        if (clean.startsWith('237')) return clean;
        if (clean.length === 9) return '237' + clean;
        return clean;
    }

    app.get("/api/config/reception", (req, res) => {
        const conf = getStoredConfig();
        const rawNumbers = conf.receptionistNumber || process.env.RECEPTIONIST_NUMBER || "695591420";
        const primaryNumber = rawNumbers.split(/[,; ]+/).map(n => formatCameroonPhone(n)).filter(Boolean)[0] || "237695591420";
        res.json({
            receptionistNumber: primaryNumber,
            isWhatsAppConnected: isConnected
        });
    });

    app.post("/api/config/reception", verifyAdmin, (req, res) => {
        const { receptionistNumber } = req.body || {};
        if (!receptionistNumber || typeof receptionistNumber !== 'string') {
            return res.status(400).json({ error: "Numéro de réception invalide" });
        }
        const formatted = formatCameroonPhone(receptionistNumber.trim());
        if (formatted.length < 9) {
            return res.status(400).json({ error: "Numéro de téléphone trop court ou invalide" });
        }
        saveStoredConfig({ receptionistNumber: formatted });
        console.log(`📞 [Config] Receptionist WhatsApp number updated to: ${formatted}`);
        res.json({
            success: true,
            receptionistNumber: formatted,
            message: "Numéro de la réception mis à jour avec succès"
        });
    });

    // Orders Inbox listing endpoint
    app.get("/api/orders", verifyAdmin, (req, res) => {
        const orders = loadOrders();
        const { status } = req.query;
        let filtered = orders;
        if (status && typeof status === 'string' && status !== 'all') {
            filtered = orders.filter(o => o.status === status);
        }
        const unreadCount = orders.filter(o => o.status === 'nouveau').length;
        res.json({
            success: true,
            orders: filtered,
            totalCount: orders.length,
            unreadCount
        });
    });

    // Update order status or notes
    app.patch("/api/orders/:id/status", verifyAdmin, (req, res) => {
        const { id } = req.params;
        const { status, notes } = req.body;
        const orders = loadOrders();
        const index = orders.findIndex(o => o.id === id);
        if (index === -1) {
            return res.status(404).json({ error: "Order not found" });
        }
        if (status) orders[index].status = status;
        if (notes !== undefined) orders[index].notes = notes;
        saveOrders(orders);
        res.json({ success: true, order: orders[index] });
    });

    // Delete or archive order
    app.delete("/api/orders/:id", verifyAdmin, (req, res) => {
        const { id } = req.params;
        let orders = loadOrders();
        const initialLength = orders.length;
        orders = orders.filter(o => o.id !== id);
        if (orders.length === initialLength) {
            return res.status(404).json({ error: "Order not found" });
        }
        saveOrders(orders);
        res.json({ success: true, message: "Order removed from inbox" });
    });

    // CSV export of orders
    app.get("/api/orders/export", verifyAdmin, (req, res) => {
        const orders = loadOrders();
        const headers = ["ID", "Date Creation", "Statut", "Client", "Telephone", "Evenement", "Date Evenement", "Heure", "Lieu", "Futs", "Marques", "Notes"];
        const rows = orders.map(o => [
            o.id,
            o.createdAt,
            o.status,
            `"${(o.nomClient || '').replace(/"/g, '""')}"`,
            `"${(o.phone || '').replace(/"/g, '""')}"`,
            `"${(o.natureEvenement || '').replace(/"/g, '""')}"`,
            `"${(o.dateEvenement || '').replace(/"/g, '""')}"`,
            `"${(o.heurePrestation || '').replace(/"/g, '""')}"`,
            `"${(o.lieuEvenement || '').replace(/"/g, '""')}"`,
            o.nombreFuts,
            `"${(o.marquesSouhaitees || '').replace(/"/g, '""')}"`,
            `"${(o.notes || '').replace(/"/g, '""')}"`
        ]);
        const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename=commandes-diego-${new Date().toISOString().slice(0, 10)}.csv`);
        res.send(csvContent);
    });

    app.post("/api/submit-lead", async (req, res) => {
        const leadData = req.body;
        const storedConf = getStoredConfig();
        const receptionistConfig = storedConf.receptionistNumber || process.env.RECEPTIONIST_NUMBER || "";
        const googleScriptUrl = process.env.GOOGLE_SCRIPT_URL;

        console.log("Received lead submission request:", leadData);

        // 1. Create and persist Order Item in Inbox
        const orderId = `CMD-${new Date().getFullYear().toString().slice(-2)}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
        const newOrder = {
            id: orderId,
            nomClient: leadData.nomClient || "Client Inconnu",
            phone: leadData.phone || "",
            natureEvenement: leadData.natureEvenement || "",
            dateEvenement: leadData.dateEvenement || "",
            lieuEvenement: leadData.lieuEvenement || "",
            nombreFuts: Number(leadData.nombreFuts) || 1,
            marquesSouhaitees: leadData.marquesSouhaitees || "",
            heurePrestation: leadData.heurePrestation || "",
            createdAt: new Date().toISOString(),
            status: 'nouveau',
            notes: '',
            whatsappSent: false
        };

        const orders = loadOrders();
        orders.unshift(newOrder);
        saveOrders(orders);
        console.log(`📥 [Inbox] Order ${orderId} saved to orders store.`);

        const results = {
            inbox: "saved",
            orderId: orderId,
            whatsapp: "skipped"
        };

        try {
            // Send WhatsApp Alert directly to receptionists' inbox
            const rawRecipients = (receptionistConfig || "695591420")
                .split(/[,; ]+/)
                .map(n => formatCameroonPhone(n))
                .filter(n => n.length >= 9);

            const primaryReceptionist = rawRecipients[0] || "237695591420";

            // Format direct WhatsApp link targeting the receptionist's inbox
            const waDirectMessage = [
                `🌟 *NOUVELLE COMMANDE BIÈRE PRESSION - DIEGO SAS* 🌟`,
                `📋 *Réf:* ${orderId}`,
                ``,
                `👤 *Client:* ${leadData.nomClient}`,
                `📞 *Téléphone:* ${leadData.phone}`,
                `🎉 *Événement:* ${leadData.natureEvenement}`,
                `📅 *Date:* ${leadData.dateEvenement} à ${leadData.heurePrestation}`,
                `📍 *Lieu:* ${leadData.lieuEvenement}`,
                `🍺 *Quantité:* ${leadData.nombreFuts} fûts`,
                `🏷️ *Marques:* ${leadData.marquesSouhaitees}`,
                ``,
                `_Bonjour la Réception, je confirme ma réservation pour la bière pression passée sur le site Diego._`
            ].join('\n');

            const directWhatsAppUrl = `https://wa.me/${primaryReceptionist}?text=${encodeURIComponent(waDirectMessage)}`;

            if (rawRecipients.length > 0) {
                if (sock && isConnected) {
                    let sentCount = 0;
                    const cleanPhone = formatCameroonPhone(leadData.phone || '');
                    const waLink = cleanPhone ? `https://wa.me/${cleanPhone}` : '';

                    const botMessage = [
                        `🌟 *NOUVELLE COMMANDE REÇUE - DIEGO SAS* 🌟`,
                        `📋 *Réf:* ${orderId}`,
                        ``,
                        `👤 *Client:* ${leadData.nomClient}`,
                        `📞 *Téléphone:* ${leadData.phone}`,
                        `🎉 *Événement:* ${leadData.natureEvenement}`,
                        `📅 *Date:* ${leadData.dateEvenement}`,
                        `📍 *Lieu:* ${leadData.lieuEvenement}`,
                        `🕒 *Heure:* ${leadData.heurePrestation}`,
                        `🍺 *Fûts:* ${leadData.nombreFuts} fûts`,
                        `🏷️ *Marques:* ${leadData.marquesSouhaitees}`,
                        ``,
                        waLink ? `👉 *Répondre au client:* ${waLink}` : ``,
                        ``,
                        `⚠️ *NB:* Service et transport offerts dès 3 fûts à Yaoundé.`,
                        `⚡ _Consultez la boîte de réception dans l'application._`
                    ].filter(Boolean).join('\n');

                    for (const num of rawRecipients) {
                        try {
                            const formattedNumber = `${num}@s.whatsapp.net`;
                            await sock.sendMessage(formattedNumber, { text: botMessage });
                            console.log(`✅ WhatsApp order alert dispatched to receptionist ${num}`);
                            sentCount++;
                        } catch (err: any) {
                            console.error(`❌ Failed to send WhatsApp alert to ${num}:`, err.message);
                        }
                    }

                    // Also send automated confirmation message to customer's WhatsApp if valid
                    if (cleanPhone && cleanPhone.length >= 9 && !rawRecipients.includes(cleanPhone)) {
                        try {
                            const customerJid = `${cleanPhone}@s.whatsapp.net`;
                            const customerMsg = [
                                `🍺 *CONFIRMATION DE RÉSERVATION - DIEGO SAS*`,
                                `Bonjour *${leadData.nomClient}*, nous confirmons la réception de votre demande de bière pression.`,
                                ``,
                                `📋 *Référence :* ${orderId}`,
                                `🎉 *Événement :* ${leadData.natureEvenement}`,
                                `📅 *Date :* ${leadData.dateEvenement} à ${leadData.heurePrestation}`,
                                `📍 *Lieu :* ${leadData.lieuEvenement}`,
                                `🍺 *Quantité :* ${leadData.nombreFuts} fûts (${leadData.marquesSouhaitees})`,
                                ``,
                                `Notre équipe de réception traite votre commande. Nous vous recontacterons très rapidement pour finaliser la livraison de la tireuse.`,
                                `_Diego SAS • Service Pression Professionnel Yaoundé_`
                            ].join('\n');
                            await sock.sendMessage(customerJid, { text: customerMsg });
                            console.log(`✅ Automated WhatsApp confirmation sent directly to customer ${cleanPhone}`);
                        } catch (custErr: any) {
                            console.warn(`Could not send direct WA confirmation to customer ${cleanPhone}:`, custErr.message);
                        }
                    }

                    if (sentCount > 0) {
                        results.whatsapp = `sent_to_${sentCount}_recipients`;
                        newOrder.whatsappSent = true;
                    } else {
                        results.whatsapp = "failed_to_send";
                    }
                } else {
                    console.log("ℹ️ WhatsApp server bot not linked; client direct WhatsApp redirect will handle inbox dispatch");
                    results.whatsapp = "not_connected";
                }
            } else {
                console.log("ℹ️ WhatsApp skipped: No receptionist numbers configured");
                results.whatsapp = "no_receptionist_configured";
            }

            // Update persisted order with transmission flags
            saveOrders(orders);

            res.json({ 
                success: true, 
                message: "Commande enregistrée et transmise à la réception", 
                order: newOrder,
                directWhatsAppUrl,
                receptionistNumber: primaryReceptionist,
                details: results 
            });
        } catch (error: any) {
            console.error("🔥 Critical Error processing lead:", error.message);
            res.status(500).json({ success: false, error: "Internal server error" });
        }
    });

    // --- Vite Middleware ---
    if (process.env.NODE_ENV !== "production") {
        const vite = await createViteServer({
            server: { 
                middlewareMode: true,
                hmr: false, // Explicitly disable HMR to avoid port conflicts
            },
            appType: "spa",
        });
        app.use(vite.middlewares);
    } else {
        const distPath = path.join(process.cwd(), 'dist');
        app.use(express.static(distPath));
        app.get('*', (req, res) => {
            res.sendFile(path.join(distPath, 'index.html'));
        });
    }

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

startServer();
