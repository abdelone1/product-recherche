/**
 * Product Research Tool - Main Application
 * Analyzes Facebook Ads Library for product opportunities in Africa
 */

// ============================================
// Configuration & Data
// ============================================

const CONFIG = {
    STORAGE_KEY: 'productResearchData',
    COUNTRIES: [
        { code: 'TD', name: 'Tchad', flag: '🇹🇩' },
        { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫' },
        { code: 'TG', name: 'Togo', flag: '🇹🇬' },
        { code: 'NE', name: 'Niger', flag: '🇳🇪' },
        { code: 'CI', name: 'Côte d\'Ivoire', flag: '🇨🇮' },
        { code: 'BJ', name: 'Bénin', flag: '🇧🇯' },
        { code: 'GA', name: 'Gabon', flag: '🇬🇦' },
        { code: 'ML', name: 'Mali', flag: '🇲🇱' },
        { code: 'SN', name: 'Sénégal', flag: '🇸🇳' },
        { code: 'GN', name: 'Guinée', flag: '🇬🇳' }
    ],
    SCORING: {
        audience: 15,      // Large audience
        problem: 20,       // Solves a problem
        wow: 15,           // Wow effect
        competition: 15,   // Low competition
        price: 15,         // Price <= 5 USD (auto-calculated)
        weight: 10,        // Weight <= 350g (auto-calculated)
        upsell: 10         // Upsell possibility
    },
    THRESHOLDS: {
        maxBuyPrice: 5,    // USD
        maxWeight: 350,    // grams
        minProfit: 6,      // USD
        idealProfit: 10    // USD
    }
};

// ============================================
// Supabase Integration
// ============================================

const SUPABASE_URL = 'https://fryqwwiqainzhjiigsma.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyeXF3d2lxYWluemhqaWlnc21hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NDQ2NjMsImV4cCI6MjA4MTEyMDY2M30.8r-9kwBdxp6bhKtZR-IfNS3STfOttwHoJMsE3Yny778';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

console.log("⚡ Supabase initialized!");

// ============================================
// User Accounts (Supabase Auth)
// ============================================
// Users are now stored in Supabase 'users' table

let currentUser = localStorage.getItem('productResearchUser') || null;

// ============================================
// State Management
// ============================================

let products = [];
let currentEditId = null;

// Sample products based on research
const SAMPLE_PRODUCTS = [
    {
        id: '1',
        name: 'Lampe Sunset / Projection Coucher de Soleil',
        buyPrice: '3.50',
        sellPrice: '18.00',
        weight: '200',
        link: 'https://www.alibaba.com/trade/search?SearchText=sunset+projection+lamp',
        countries: ['SN', 'CI', 'ML', 'BF', 'TG'],
        criteria: { audience: true, problem: false, wow: true, competition: true, upsell: false },
        notes: 'Ultra-viral sur TikTok, effet WOW instantané, parfait pour les jeunes. Décoration tendance.',
        score: 95,
        grade: 'A',
        profit: 14.50,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    },
    {
        id: '2',
        name: 'LED Strip RGB avec Télécommande (5m)',
        buyPrice: '3.00',
        sellPrice: '14.00',
        weight: '150',
        link: 'https://www.alibaba.com/trade/search?SearchText=led+strip+rgb+remote',
        countries: ['SN', 'CI', 'BJ', 'TG', 'GA'],
        criteria: { audience: true, problem: false, wow: true, competition: false, upsell: true },
        notes: 'Décoration chambre très tendance. Upsell possible: plusieurs longueurs (5m, 10m, 20m).',
        score: 90,
        grade: 'A',
        profit: 11.00,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    },
    {
        id: '3',
        name: 'Mini Ventilateur USB Portable',
        buyPrice: '2.50',
        sellPrice: '10.00',
        weight: '100',
        link: 'https://www.alibaba.com/trade/search?SearchText=mini+usb+fan+portable',
        countries: ['TD', 'NE', 'ML', 'BF', 'SN'],
        criteria: { audience: true, problem: true, wow: false, competition: false, upsell: false },
        notes: 'ESSENTIEL pour le climat chaud africain. Très forte demande en été.',
        score: 85,
        grade: 'A',
        profit: 7.50,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    },
    {
        id: '4',
        name: 'Power Bank 10000mAh Compact',
        buyPrice: '5.00',
        sellPrice: '16.00',
        weight: '200',
        link: 'https://www.alibaba.com/trade/search?SearchText=power+bank+10000mah',
        countries: ['TD', 'NE', 'BF', 'ML', 'GN', 'SN', 'CI', 'BJ', 'TG', 'GA'],
        criteria: { audience: true, problem: true, wow: false, competition: false, upsell: true },
        notes: 'INDISPENSABLE en Afrique (coupures électriques). Tout le monde en a besoin. Upsell: 20000mAh.',
        score: 85,
        grade: 'A',
        profit: 11.00,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    },
    {
        id: '5',
        name: 'Écouteurs Sans Fil TWS (Style Airpods)',
        buyPrice: '4.00',
        sellPrice: '15.00',
        weight: '50',
        link: 'https://www.alibaba.com/trade/search?SearchText=tws+wireless+earbuds',
        countries: ['SN', 'CI', 'GA', 'BJ', 'TG'],
        criteria: { audience: true, problem: false, wow: true, competition: false, upsell: false },
        notes: 'Look premium, très demandés par les jeunes. Effet statut social.',
        score: 80,
        grade: 'A',
        profit: 11.00,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    },
    {
        id: '6',
        name: 'Ring Light pour Téléphone (Selfie)',
        buyPrice: '3.50',
        sellPrice: '12.00',
        weight: '150',
        link: 'https://www.alibaba.com/trade/search?SearchText=ring+light+phone',
        countries: ['SN', 'CI', 'GA', 'BJ'],
        criteria: { audience: true, problem: true, wow: false, competition: true, upsell: false },
        notes: 'Pour TikTok/vidéos, créateurs de contenu. Marché en croissance.',
        score: 80,
        grade: 'A',
        profit: 8.50,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    },
    {
        id: '7',
        name: 'Support Téléphone pour Cou (Lazy Holder)',
        buyPrice: '2.00',
        sellPrice: '8.00',
        weight: '80',
        link: 'https://www.alibaba.com/trade/search?SearchText=lazy+neck+phone+holder',
        countries: ['SN', 'CI', 'ML', 'BF', 'TG', 'BJ'],
        criteria: { audience: true, problem: true, wow: false, competition: true, upsell: false },
        notes: 'Mains libres pour regarder des vidéos. Très pratique.',
        score: 75,
        grade: 'B',
        profit: 6.00,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    },
    {
        id: '8',
        name: 'Mini Aspirateur de Bureau USB',
        buyPrice: '4.50',
        sellPrice: '13.00',
        weight: '200',
        link: 'https://www.alibaba.com/trade/search?SearchText=mini+desktop+vacuum+cleaner',
        countries: ['GA', 'SN', 'CI'],
        criteria: { audience: false, problem: true, wow: true, competition: true, upsell: false },
        notes: 'Gadget satisfaisant, viral sur TikTok. Nettoie clavier et bureau.',
        score: 75,
        grade: 'B',
        profit: 8.50,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    },
    {
        id: '9',
        name: 'Chargeur Rapide USB-C 20W',
        buyPrice: '2.50',
        sellPrice: '9.00',
        weight: '50',
        link: 'https://www.alibaba.com/trade/search?SearchText=usb+c+fast+charger+20w',
        countries: ['TD', 'NE', 'BF', 'ML', 'GN', 'SN', 'CI', 'BJ', 'TG', 'GA'],
        criteria: { audience: true, problem: true, wow: false, competition: false, upsell: true },
        notes: 'Besoin constant, consommable. Les gens perdent/cassent leurs chargeurs.',
        score: 70,
        grade: 'B',
        profit: 6.50,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    },
    {
        id: '10',
        name: 'Lampe Torche LED Rechargeable USB',
        buyPrice: '3.00',
        sellPrice: '11.00',
        weight: '150',
        link: 'https://www.alibaba.com/trade/search?SearchText=led+flashlight+rechargeable',
        countries: ['TD', 'NE', 'BF', 'ML', 'GN', 'BJ', 'TG'],
        criteria: { audience: true, problem: true, wow: false, competition: false, upsell: false },
        notes: 'ESSENTIEL pour coupures électriques. Forte demande dans zones rurales.',
        score: 85,
        grade: 'A',
        profit: 8.00,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    },
    // ========== NOUVEAUX GADGETS ÉLECTRONIQUES UNIQUES ==========
    {
        id: '11',
        name: 'Lampe Lune Lévitation Magnétique',
        buyPrice: '10.00',
        sellPrice: '45.00',
        weight: '300',
        link: 'https://www.alibaba.com/trade/search?SearchText=magnetic+levitating+moon+lamp',
        countries: ['SN', 'CI', 'GA', 'BJ', 'TG'],
        criteria: { audience: true, problem: false, wow: true, competition: true, upsell: false },
        notes: 'EFFET WOW MAXIMUM - Flotte dans l\'air grâce aux aimants ! INTROUVABLE en Afrique. Décoration premium.',
        score: 95,
        grade: 'A',
        profit: 35.00,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    },
    {
        id: '12',
        name: 'Mini Imprimante Thermique Portable',
        buyPrice: '12.00',
        sellPrice: '40.00',
        weight: '200',
        link: 'https://www.alibaba.com/trade/search?SearchText=portable+thermal+mini+printer+photo',
        countries: ['SN', 'CI', 'GA', 'ML', 'BF'],
        criteria: { audience: true, problem: true, wow: true, competition: true, upsell: true },
        notes: 'VIRAL TikTok - Imprime photos/stickers SANS ENCRE depuis téléphone. Upsell: papier thermique.',
        score: 100,
        grade: 'A',
        profit: 28.00,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    },
    {
        id: '13',
        name: 'Micro Karaoké Bluetooth avec LED',
        buyPrice: '7.00',
        sellPrice: '22.00',
        weight: '250',
        link: 'https://www.alibaba.com/trade/search?SearchText=karaoke+microphone+bluetooth+led',
        countries: ['SN', 'CI', 'ML', 'BF', 'TG', 'BJ', 'GA'],
        criteria: { audience: true, problem: false, wow: true, competition: false, upsell: false },
        notes: 'Fêtes et divertissement. Change la voix, effets LED, haut-parleur intégré. Très populaire.',
        score: 85,
        grade: 'A',
        profit: 15.00,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    },
    {
        id: '14',
        name: 'Mini Projecteur de Poche HD',
        buyPrice: '20.00',
        sellPrice: '55.00',
        weight: '300',
        link: 'https://www.alibaba.com/trade/search?SearchText=mini+pocket+projector+portable',
        countries: ['SN', 'CI', 'GA'],
        criteria: { audience: false, problem: true, wow: true, competition: true, upsell: false },
        notes: 'Cinéma portable ! Projette films depuis téléphone. Premium mais forte marge.',
        score: 80,
        grade: 'A',
        profit: 35.00,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    },
    {
        id: '15',
        name: 'Projecteur Galaxie/Étoiles LED',
        buyPrice: '6.00',
        sellPrice: '20.00',
        weight: '200',
        link: 'https://www.alibaba.com/trade/search?SearchText=galaxy+star+projector+night+light',
        countries: ['SN', 'CI', 'ML', 'BF', 'TG', 'BJ', 'GA', 'NE'],
        criteria: { audience: true, problem: false, wow: true, competition: true, upsell: false },
        notes: 'VIRAL - Transforme la chambre en ciel étoilé ! Décoration chambre WOW. Très populaire jeunes.',
        score: 90,
        grade: 'A',
        profit: 14.00,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    },
    {
        id: '16',
        name: 'Power Bank Solaire Pliable 20000mAh',
        buyPrice: '12.00',
        sellPrice: '35.00',
        weight: '350',
        link: 'https://www.alibaba.com/trade/search?SearchText=solar+power+bank+foldable',
        countries: ['TD', 'NE', 'BF', 'ML', 'GN', 'SN', 'CI', 'BJ', 'TG'],
        criteria: { audience: true, problem: true, wow: true, competition: true, upsell: true },
        notes: 'PARFAIT pour Afrique - Se recharge AU SOLEIL ! Résout coupures électriques. Innovation.',
        score: 95,
        grade: 'A',
        profit: 23.00,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    },
    {
        id: '17',
        name: 'Ventilateur de Cou Portable (Neck Fan)',
        buyPrice: '5.00',
        sellPrice: '16.00',
        weight: '150',
        link: 'https://www.alibaba.com/trade/search?SearchText=portable+neck+fan+rechargeable',
        countries: ['TD', 'NE', 'BF', 'ML', 'SN', 'CI', 'TG', 'BJ'],
        criteria: { audience: true, problem: true, wow: true, competition: true, upsell: false },
        notes: 'CLIMAT CHAUD = Forte demande ! Mains libres, rechargeable. Tendance 2024.',
        score: 90,
        grade: 'A',
        profit: 11.00,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    },
    {
        id: '18',
        name: 'Humidificateur USB Mini Brume',
        buyPrice: '4.00',
        sellPrice: '12.00',
        weight: '100',
        link: 'https://www.alibaba.com/trade/search?SearchText=mini+usb+humidifier+mist',
        countries: ['TD', 'NE', 'BF', 'ML', 'SN'],
        criteria: { audience: true, problem: true, wow: false, competition: true, upsell: false },
        notes: 'Combat la chaleur sèche. Format compact, USB. Diffuseur d\'huiles essentielles possible.',
        score: 75,
        grade: 'B',
        profit: 8.00,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    },
    {
        id: '19',
        name: 'Lampe Camping LED Solaire 3-en-1',
        buyPrice: '5.00',
        sellPrice: '15.00',
        weight: '200',
        link: 'https://www.alibaba.com/trade/search?SearchText=solar+camping+lantern+led',
        countries: ['TD', 'NE', 'BF', 'ML', 'GN', 'BJ', 'TG'],
        criteria: { audience: true, problem: true, wow: false, competition: false, upsell: false },
        notes: 'ZONES RURALES - Solaire + USB + Piles. Multifonction pour coupures électriques.',
        score: 85,
        grade: 'A',
        profit: 10.00,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    },
    {
        id: '20',
        name: 'Clavier Bluetooth Pliable Pocket',
        buyPrice: '10.00',
        sellPrice: '28.00',
        weight: '180',
        link: 'https://www.alibaba.com/trade/search?SearchText=foldable+bluetooth+keyboard+pocket',
        countries: ['SN', 'CI', 'GA', 'ML'],
        criteria: { audience: false, problem: true, wow: true, competition: true, upsell: false },
        notes: 'Pour étudiants et professionnels. Se plie dans la poche ! Travail mobile.',
        score: 75,
        grade: 'B',
        profit: 18.00,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    },
    {
        id: '21',
        name: 'Stylo Traducteur Scanner OCR',
        buyPrice: '18.00',
        sellPrice: '50.00',
        weight: '50',
        link: 'https://www.alibaba.com/trade/search?SearchText=translator+pen+scanner+ocr',
        countries: ['SN', 'CI', 'GA'],
        criteria: { audience: false, problem: true, wow: true, competition: true, upsell: false },
        notes: 'INNOVATION - Scanne texte → Traduit instantanément ! Pour étudiants langues.',
        score: 80,
        grade: 'A',
        profit: 32.00,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    },
    {
        id: '22',
        name: 'Smart Ring (Bague Connectée Santé)',
        buyPrice: '12.00',
        sellPrice: '35.00',
        weight: '20',
        link: 'https://www.alibaba.com/trade/search?SearchText=smart+ring+health+tracker',
        countries: ['SN', 'CI', 'GA'],
        criteria: { audience: false, problem: true, wow: true, competition: true, upsell: false },
        notes: 'TRÈS INNOVANT - Suivi santé SANS montre ! Discret, léger. Premium tech.',
        score: 80,
        grade: 'A',
        profit: 23.00,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    },
    {
        id: '23',
        name: 'Manette Téléphone + Refroidisseur Gaming',
        buyPrice: '6.00',
        sellPrice: '18.00',
        weight: '150',
        link: 'https://www.alibaba.com/trade/search?SearchText=phone+gamepad+cooler+controller',
        countries: ['SN', 'CI', 'ML', 'BF', 'TG', 'BJ'],
        criteria: { audience: true, problem: true, wow: false, competition: true, upsell: false },
        notes: 'Pour gamers mobile (PUBG, Free Fire). Joue + refroidit le téléphone.',
        score: 80,
        grade: 'A',
        profit: 12.00,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    },
    {
        id: '24',
        name: 'Enceinte Bluetooth Flottante LED',
        buyPrice: '9.00',
        sellPrice: '25.00',
        weight: '200',
        link: 'https://www.alibaba.com/trade/search?SearchText=floating+bluetooth+speaker+pool+led',
        countries: ['SN', 'CI', 'GA', 'TG'],
        criteria: { audience: false, problem: false, wow: true, competition: true, upsell: false },
        notes: 'FLOTTE SUR L\'EAU + LED RGB ! Pool party, plage. Effet WOW garanti.',
        score: 80,
        grade: 'A',
        profit: 16.00,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    },
    {
        id: '25',
        name: 'Mini Caméra Porte-clés HD 1080p',
        buyPrice: '7.00',
        sellPrice: '20.00',
        weight: '30',
        link: 'https://www.alibaba.com/trade/search?SearchText=mini+keychain+camera+hd+1080p',
        countries: ['SN', 'CI', 'GA', 'ML'],
        criteria: { audience: false, problem: true, wow: true, competition: true, upsell: false },
        notes: 'Ultra discret, format porte-clés. Enregistre vidéo HD. Sécurité personnelle.',
        score: 80,
        grade: 'A',
        profit: 13.00,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    },
    // ========== PRODUITS PRATIQUES MAISON/JARDIN (Style Arroseur) ==========
    {
        id: '26',
        name: 'Arroseur Rotatif 360° 3 Bras',
        buyPrice: '4.00',
        sellPrice: '12.00',
        weight: '200',
        link: 'https://www.alibaba.com/trade/search?SearchText=360+rotating+sprinkler+3+arms',
        countries: ['TD', 'NE', 'BF', 'ML', 'GN', 'SN', 'CI', 'BJ', 'TG', 'GA'],
        criteria: { audience: true, problem: true, wow: false, competition: false, upsell: false },
        notes: 'CLASSIQUE - Arrosage jardin automatique. Large audience, tout le monde en a besoin.',
        score: 80,
        grade: 'A',
        profit: 8.00,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    },
    {
        id: '27',
        name: 'Kit Arrosage Goutte-à-Goutte Automatique',
        buyPrice: '5.50',
        sellPrice: '16.00',
        weight: '300',
        link: 'https://www.alibaba.com/trade/search?SearchText=drip+irrigation+kit+automatic',
        countries: ['TD', 'NE', 'BF', 'ML', 'SN', 'CI', 'BJ', 'TG'],
        criteria: { audience: true, problem: true, wow: false, competition: true, upsell: true },
        notes: 'Économie d\'eau + vacances. Kit complet avec timer. Upsell: extensions.',
        score: 85,
        grade: 'A',
        profit: 10.50,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    },
    {
        id: '28',
        name: 'Timer Arrosage Programmable Digital',
        buyPrice: '6.00',
        sellPrice: '18.00',
        weight: '150',
        link: 'https://www.alibaba.com/trade/search?SearchText=water+timer+digital+programmable',
        countries: ['SN', 'CI', 'GA', 'ML', 'BF'],
        criteria: { audience: false, problem: true, wow: true, competition: true, upsell: false },
        notes: 'Arrosage automatique programmé. Innovation pour jardins.',
        score: 80,
        grade: 'A',
        profit: 12.00,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    },
    {
        id: '29',
        name: 'Système Arrosage Solaire Complet',
        buyPrice: '10.00',
        sellPrice: '28.00',
        weight: '350',
        link: 'https://www.alibaba.com/trade/search?SearchText=solar+drip+irrigation+system',
        countries: ['TD', 'NE', 'BF', 'ML', 'GN', 'SN', 'CI', 'BJ', 'TG'],
        criteria: { audience: true, problem: true, wow: true, competition: true, upsell: true },
        notes: 'PARFAIT AFRIQUE - Fonctionne AU SOLEIL ! Pas besoin d\'électricité. Innovation.',
        score: 95,
        grade: 'A',
        profit: 18.00,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    },
    {
        id: '30',
        name: 'Tuyau Extensible Magique 30m',
        buyPrice: '7.00',
        sellPrice: '22.00',
        weight: '300',
        link: 'https://www.alibaba.com/trade/search?SearchText=expandable+garden+hose+30m',
        countries: ['SN', 'CI', 'GA', 'ML', 'BF', 'TG', 'BJ'],
        criteria: { audience: true, problem: true, wow: true, competition: false, upsell: false },
        notes: 'MAGIC - S\'étend de 10m à 30m + se rétracte ! Facile à ranger.',
        score: 85,
        grade: 'A',
        profit: 15.00,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    },
    {
        id: '31',
        name: 'Arrosoir Automatique pour Bouteille',
        buyPrice: '1.50',
        sellPrice: '5.00',
        weight: '50',
        link: 'https://www.alibaba.com/trade/search?SearchText=automatic+plant+watering+bottle+spike',
        countries: ['TD', 'NE', 'BF', 'ML', 'GN', 'SN', 'CI', 'BJ', 'TG', 'GA'],
        criteria: { audience: true, problem: true, wow: false, competition: false, upsell: true },
        notes: 'ULTRA SIMPLE - Se met sur bouteille, arrose tout seul. Lot de plusieurs.',
        score: 75,
        grade: 'B',
        profit: 3.50,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    },
    {
        id: '32',
        name: 'Ruban Anti-Fuite Silicone Magique',
        buyPrice: '2.00',
        sellPrice: '8.00',
        weight: '100',
        link: 'https://www.alibaba.com/trade/search?SearchText=silicone+repair+tape+leak+waterproof',
        countries: ['TD', 'NE', 'BF', 'ML', 'GN', 'SN', 'CI', 'BJ', 'TG', 'GA'],
        criteria: { audience: true, problem: true, wow: true, competition: true, upsell: true },
        notes: 'VIRAL - Répare fuites SANS colle ni outils ! Parfait pour vidéo démo.',
        score: 90,
        grade: 'A',
        profit: 6.00,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    },
    {
        id: '33',
        name: 'Pommeau Douche Haute Pression Éco',
        buyPrice: '3.50',
        sellPrice: '12.00',
        weight: '150',
        link: 'https://www.alibaba.com/trade/search?SearchText=high+pressure+shower+head+water+saving',
        countries: ['TD', 'NE', 'BF', 'ML', 'GN', 'SN', 'CI', 'BJ', 'TG', 'GA'],
        criteria: { audience: true, problem: true, wow: false, competition: false, upsell: false },
        notes: 'Pression forte + économise 50% eau ! Problème courant résolu.',
        score: 85,
        grade: 'A',
        profit: 8.50,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    },
    {
        id: '34',
        name: 'Lampe Solaire Murale Capteur Mouvement',
        buyPrice: '4.00',
        sellPrice: '13.00',
        weight: '200',
        link: 'https://www.alibaba.com/trade/search?SearchText=solar+wall+light+motion+sensor',
        countries: ['TD', 'NE', 'BF', 'ML', 'GN', 'SN', 'CI', 'BJ', 'TG', 'GA'],
        criteria: { audience: true, problem: true, wow: false, competition: false, upsell: true },
        notes: 'SOLAIRE + CAPTEUR - Pas d\'électricité, s\'allume automatiquement. Sécurité.',
        score: 90,
        grade: 'A',
        profit: 9.00,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    },
    {
        id: '35',
        name: 'Multiprise Rotative 360° USB',
        buyPrice: '5.00',
        sellPrice: '15.00',
        weight: '250',
        link: 'https://www.alibaba.com/trade/search?SearchText=rotating+power+strip+usb+360',
        countries: ['SN', 'CI', 'GA', 'ML', 'BF', 'TG', 'BJ'],
        criteria: { audience: true, problem: true, wow: true, competition: true, upsell: false },
        notes: 'INNOVANT - Tourne 360° pour tout brancher ! + ports USB.',
        score: 85,
        grade: 'A',
        profit: 10.00,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    },
    {
        id: '36',
        name: 'Brosse Électrique Spin Scrubber',
        buyPrice: '10.00',
        sellPrice: '28.00',
        weight: '350',
        link: 'https://www.alibaba.com/trade/search?SearchText=electric+spin+scrubber+cleaning+brush',
        countries: ['SN', 'CI', 'GA'],
        criteria: { audience: false, problem: true, wow: true, competition: true, upsell: true },
        notes: 'Nettoie SANS effort ! Salle de bain, cuisine. Viral sur TikTok.',
        score: 80,
        grade: 'A',
        profit: 18.00,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    },
    {
        id: '37',
        name: 'Crochets Adhésifs Puissants (Lot 10)',
        buyPrice: '2.50',
        sellPrice: '8.00',
        weight: '100',
        link: 'https://www.alibaba.com/trade/search?SearchText=strong+adhesive+hooks+heavy+duty',
        countries: ['TD', 'NE', 'BF', 'ML', 'GN', 'SN', 'CI', 'BJ', 'TG', 'GA'],
        criteria: { audience: true, problem: true, wow: false, competition: false, upsell: true },
        notes: 'PAS DE PERÇAGE ! Supporte 10kg. Lot = meilleure marge.',
        score: 75,
        grade: 'B',
        profit: 5.50,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    },
    {
        id: '38',
        name: 'Coupe-Légumes Multifonction 5-en-1',
        buyPrice: '5.00',
        sellPrice: '15.00',
        weight: '300',
        link: 'https://www.alibaba.com/trade/search?SearchText=vegetable+chopper+slicer+multifunction',
        countries: ['TD', 'NE', 'BF', 'ML', 'GN', 'SN', 'CI', 'BJ', 'TG', 'GA'],
        criteria: { audience: true, problem: true, wow: true, competition: false, upsell: false },
        notes: 'VIRAL CUISINE - Râpe, coupe, émince, tranche ! Parfait démo vidéo.',
        score: 90,
        grade: 'A',
        profit: 10.00,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    },
    {
        id: '39',
        name: 'Aiguiseur Couteaux Électrique USB',
        buyPrice: '6.00',
        sellPrice: '16.00',
        weight: '200',
        link: 'https://www.alibaba.com/trade/search?SearchText=electric+knife+sharpener+usb',
        countries: ['SN', 'CI', 'GA', 'ML', 'BF', 'TG', 'BJ'],
        criteria: { audience: true, problem: true, wow: true, competition: true, upsell: false },
        notes: 'Couteaux TOUJOURS tranchants ! Électrique, rapide, sécurisé.',
        score: 85,
        grade: 'A',
        profit: 10.00,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    },
    {
        id: '40',
        name: 'Mixeur Portable Rechargeable USB',
        buyPrice: '6.00',
        sellPrice: '18.00',
        weight: '350',
        link: 'https://www.alibaba.com/trade/search?SearchText=portable+blender+rechargeable+usb',
        countries: ['TD', 'NE', 'BF', 'ML', 'GN', 'SN', 'CI', 'BJ', 'TG', 'GA'],
        criteria: { audience: true, problem: true, wow: true, competition: false, upsell: false },
        notes: 'JUS FRAIS PARTOUT ! Rechargeable USB, emporte partout.',
        score: 90,
        grade: 'A',
        profit: 12.00,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    },
    {
        id: '41',
        name: 'Presse-Ail Rotatif Inox',
        buyPrice: '2.50',
        sellPrice: '8.00',
        weight: '100',
        link: 'https://www.alibaba.com/trade/search?SearchText=garlic+press+rotary+stainless',
        countries: ['TD', 'NE', 'BF', 'ML', 'GN', 'SN', 'CI', 'BJ', 'TG', 'GA'],
        criteria: { audience: true, problem: true, wow: false, competition: false, upsell: false },
        notes: 'Cuisine facile. Écraser ail/gingembre en secondes. Acier inoxydable.',
        score: 75,
        grade: 'B',
        profit: 5.50,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    },
    {
        id: '42',
        name: 'Boîte Stockage Rotative 360° Cuisine',
        buyPrice: '5.00',
        sellPrice: '15.00',
        weight: '300',
        link: 'https://www.alibaba.com/trade/search?SearchText=rotating+storage+container+360+kitchen',
        countries: ['SN', 'CI', 'GA', 'ML', 'BF'],
        criteria: { audience: true, problem: true, wow: true, competition: true, upsell: false },
        notes: 'Organisation cuisine élégante. Accès facile 360°. Design moderne.',
        score: 80,
        grade: 'A',
        profit: 10.00,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    },
    {
        id: '43',
        name: 'Ouvre-Bocal Électrique Automatique',
        buyPrice: '6.00',
        sellPrice: '16.00',
        weight: '200',
        link: 'https://www.alibaba.com/trade/search?SearchText=electric+jar+opener+automatic',
        countries: ['SN', 'CI', 'GA'],
        criteria: { audience: false, problem: true, wow: true, competition: true, upsell: false },
        notes: 'OUVRE TOUT sans effort ! Personnes âgées, cuisine facile.',
        score: 75,
        grade: 'B',
        profit: 10.00,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    },
    {
        id: '44',
        name: 'Tournevis Électrique Mini USB',
        buyPrice: '7.00',
        sellPrice: '18.00',
        weight: '150',
        link: 'https://www.alibaba.com/trade/search?SearchText=mini+electric+screwdriver+usb+rechargeable',
        countries: ['SN', 'CI', 'GA', 'ML', 'BF', 'TG', 'BJ'],
        criteria: { audience: true, problem: true, wow: true, competition: true, upsell: false },
        notes: 'COMPACT et puissant ! Rechargeable USB. Bricolage facile.',
        score: 85,
        grade: 'A',
        profit: 11.00,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    },
    {
        id: '45',
        name: 'Mètre Laser Digital Compact',
        buyPrice: '9.00',
        sellPrice: '25.00',
        weight: '100',
        link: 'https://www.alibaba.com/trade/search?SearchText=laser+distance+meter+digital+mini',
        countries: ['SN', 'CI', 'GA', 'ML'],
        criteria: { audience: false, problem: true, wow: true, competition: true, upsell: false },
        notes: 'MESURE LASER instantanée ! Précis, compact. Bricoleurs/pros.',
        score: 80,
        grade: 'A',
        profit: 16.00,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    },
    // ========== RÉPULSIFS ULTRASONS (Demande Utilisateur) ==========
    {
        id: '50',
        name: 'Répulsif Solaire Ultrason Taupes & Serpents',
        buyPrice: '3.50',
        sellPrice: '12.00',
        weight: '250',
        link: 'https://www.alibaba.com/trade/search?SearchText=solar+ultrasonic+snake+mole+repeller',
        countries: ['SN', 'CI', 'BF', 'ML'],
        criteria: { audience: true, problem: true, wow: false, competition: true, upsell: true },
        notes: 'Jardinage/Agriculteurs. Protège cultures et maisons. Énergie solaire = 0 pile.',
        score: 80,
        grade: 'A',
        profit: 8.50,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    },
    {
        id: '51',
        name: 'Pack 4 Répulsifs Ultrason Prise Murale',
        buyPrice: '6.00',
        sellPrice: '19.00',
        weight: '200',
        link: 'https://www.alibaba.com/trade/search?SearchText=ultrasonic+pest+repeller+plug+in',
        countries: ['SN', 'CI', 'GA', 'TG', 'BJ'],
        criteria: { audience: true, problem: true, wow: false, competition: true, upsell: false },
        notes: 'Maison complète sans insectes/souris. Non toxique (vs sprays). Offre Pack = Panier moyen élevé.',
        score: 85,
        grade: 'A',
        profit: 13.00,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    },
    {
        id: '52',
        name: 'Bracelet Anti-Moustique Ultrasonique',
        buyPrice: '2.50',
        sellPrice: '9.00',
        weight: '50',
        link: 'https://www.alibaba.com/trade/search?SearchText=ultrasonic+mosquito+repeller+watch',
        countries: ['SN', 'CI', 'GA', 'ML', 'BF', 'TG', 'BJ'],
        criteria: { audience: true, problem: true, wow: true, competition: true, upsell: true },
        notes: 'Pour enfants et adultes. Protection sans produit chimique. Idéal saison des pluies.',
        score: 75,
        grade: 'B',
        profit: 6.50,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    },
    // ========== SPÉCIAL RAMADAN (Demande Utilisateur) ==========
    {
        id: '60',
        name: 'Bague Zikr Intelligente (Compteur + App)',
        buyPrice: '12.00',
        sellPrice: '35.00',
        weight: '50',
        link: 'https://www.alibaba.com/trade/search?SearchText=smart+zikr+ring+tasbih+counter',
        countries: ['SN', 'CI', 'ML', 'NE', 'GN', 'MA'],
        criteria: { audience: true, problem: true, wow: true, competition: true, upsell: false },
        notes: 'TOP RAMADAN. Remplace le chapelet. Connecté smartphone (heures prières). Très léger.',
        score: 90,
        grade: 'A',
        profit: 23.00,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    },
    {
        id: '61',
        name: 'Diffuseur Bukhoor Électrique Portable USB',
        buyPrice: '15.00',
        sellPrice: '40.00',
        weight: '350',
        link: 'https://www.alibaba.com/trade/search?SearchText=electric+bakhoor+burner+portable+usb',
        countries: ['SN', 'CI', 'ML', 'GA', 'KM', 'DJ'],
        criteria: { audience: true, problem: true, wow: true, competition: true, upsell: true },
        notes: 'Ambiance Ramadan. Sûr (pas de charbon), recharge USB voiture/maison. Odeur longue durée.',
        score: 85,
        grade: 'A',
        profit: 25.00,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    },
    {
        id: '62',
        name: 'Veilleuse Coranique Lune 3D (Haut-parleur)',
        buyPrice: '18.00',
        sellPrice: '45.00',
        weight: '500',
        link: 'https://www.alibaba.com/trade/search?SearchText=quran+moon+lamp+speaker+touch',
        countries: ['SN', 'CI', 'ML', 'NE', 'BF'],
        criteria: { audience: true, problem: false, wow: true, competition: true, upsell: false },
        notes: 'CADEAU IDÉAL. Récitations complètes, lumière apaisante. Décoration et apprentissage.',
        score: 95,
        grade: 'A',
        profit: 27.00,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    },
    {
        id: 'ramadan-2025-led-' + Date.now(),
        name: 'Guirlande LED Lune/Étoile Ramadan',
        buyPrice: '2.50',
        sellPrice: '16.00',
        weight: '150',
        link: 'https://www.alibaba.com/trade/search?SearchText=ramadan+led+moon+star+lights',
        countries: ['SN', 'CI', 'ML', 'NE', 'BF', 'TG'],
        criteria: { audience: true, problem: false, wow: true, competition: true, upsell: true },
        notes: 'RAMADAN 2025 🌙 Très viral sur TikTok. Décoration festive, effet WOW. Upsell: pack famille 2-3 pièces. Timing parfait avant Ramadan (février-mars).',
        score: 95,
        grade: 'A',
        profit: 13.50,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    }
];

// ============================================
// Initialization
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication FIRST
    checkAuth();

    // Setup login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    loadProducts();
    initializeUI();
    setupEventListeners();
});

function checkAuth() {
    const overlay = document.getElementById('loginOverlay');
    const userBadge = document.getElementById('currentUserBadge');

    if (currentUser) {
        // User is logged in
        if (overlay) overlay.classList.add('hidden');
        if (userBadge) userBadge.textContent = `👤 ${currentUser}`;

        // Check for extension data when already logged in
        checkUrlParams();
    } else {
        // User is NOT logged in, show overlay
        if (overlay) overlay.classList.remove('hidden');
        if (userBadge) userBadge.textContent = '';
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.toLowerCase().trim();
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');

    // Query Supabase for user authentication
    const { data, error } = await supabaseClient
        .from('users')
        .select('username, password')
        .eq('username', username)
        .single();

    if (!error && data && data.password === password) {
        currentUser = username;
        localStorage.setItem('productResearchUser', username);
        checkAuth();
        // Check for extension data after login
        checkUrlParams();
        showToast(`Bienvenue, ${username} !`);

        // Log the connection
        logActivity('Connexion', 'Session démarrée');
    } else {
        if (errorEl) errorEl.style.display = 'block';
    }
}

function logActivity(action, productName) {
    if (!currentUser) return; // Don't log if no user

    supabaseClient.from('activity_logs').insert([{
        username: currentUser,
        action: action,
        product_name: productName || 'N/A'
    }]).then(({ error }) => {
        if (error) console.error('Log error:', error);
    });
}

function loadActivityLogs() {
    supabaseClient.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(100)
        .then(({ data, error }) => {
            if (error) {
                console.error('Error loading logs:', error);
                return;
            }

            const tbody = document.getElementById('historyBody');
            const emptyState = document.getElementById('emptyHistory');
            const table = document.getElementById('historyTable');

            if (!tbody || !table) return;

            if (!data || data.length === 0) {
                table.style.display = 'none';
                if (emptyState) emptyState.style.display = 'block';
                return;
            }

            table.style.display = 'table';
            if (emptyState) emptyState.style.display = 'none';

            tbody.innerHTML = data.map(log => {
                const date = new Date(log.created_at);
                const formattedDate = date.toLocaleString('fr-FR', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                });
                return `
                <tr>
                    <td>${formattedDate}</td>
                    <td><strong>${escapeHtml(log.username)}</strong></td>
                    <td>${escapeHtml(log.action)}</td>
                    <td>${escapeHtml(log.product_name || '-')}</td>
                </tr>
                `;
            }).join('');
        });
}

function initializeUI() {
    // Initialize countries grid in Add form
    renderCountriesGrid('countriesGrid');
    renderCountriesGrid('editCountriesGrid');

    // Initialize country links for Facebook Ads
    renderCountryLinks();

    // Initialize countries settings
    renderCountriesSettings();
}

// ============================================
// Event Listeners
// ============================================

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item, [data-section]').forEach(item => {
        item.addEventListener('click', handleNavigation);
    });

    // Mobile menu toggle
    document.getElementById('menuToggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
    });

    // Sidebar Collapse (Auto-hide)
    const collapseBtn = document.getElementById('sidebarCollapseBtn');
    if (collapseBtn) {
        collapseBtn.addEventListener('click', () => {
            document.body.classList.toggle('sidebar-collapsed');
            // Save preference
            const isCollapsed = document.body.classList.contains('sidebar-collapsed');
            localStorage.setItem('sidebarCollapsed', isCollapsed);
        });

        // Load preference on startup
        if (localStorage.getItem('sidebarCollapsed') === 'true') {
            document.body.classList.add('sidebar-collapsed');
        }
    }

    // Quick add button
    document.getElementById('quickAddBtn').addEventListener('click', () => {
        navigateToSection('add-product');
    });

    // Force Refresh Button (Clear cache)
    const refreshBtn = document.getElementById('forceRefreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            sessionStorage.clear();
            localStorage.clear();
            showToast('Cache vidé ! Rechargement...');
            setTimeout(() => {
                location.reload(true);
            }, 500);
        });
    }

    // Logout Button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('productResearchUser');
            currentUser = null;
            showToast('Déconnecté !');
            checkAuth();
        });
    }

    // Product form
    document.getElementById('productForm').addEventListener('submit', handleProductSubmit);
    document.getElementById('productForm').addEventListener('reset', resetScorePreview);

    // Edit Form
    const editForm = document.getElementById('editForm');
    if (editForm) editForm.addEventListener('submit', handleEditSubmit);

    // Edit Modal Close/Cancel
    const closeModalBtn = document.getElementById('closeModal');
    const cancelEditBtn = document.getElementById('cancelEdit');
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeEditModal);
    if (cancelEditBtn) cancelEditBtn.addEventListener('click', closeEditModal);

    // Real-time score calculation
    setupScoreCalculation();

    // Event Listeners for Simulator
    document.getElementById('simBuyPrice')?.addEventListener('input', autoCalculate);
    document.getElementById('simWeight')?.addEventListener('input', autoCalculate);
    document.getElementById('simSellPrice')?.addEventListener('input', autoCalculate);
    document.getElementById('simTargetProfit')?.addEventListener('input', autoCalculate);
    document.getElementById('simQuantity')?.addEventListener('input', autoCalculate);

    // Export buttons
    document.getElementById('exportBtn').addEventListener('click', exportToCSV);
    const exportAllBtn = document.getElementById('exportAllBtn');
    if (exportAllBtn) exportAllBtn.addEventListener('click', exportToCSV);

    // Backup JSON
    const backupBtn = document.getElementById('backupBtn');
    if (backupBtn) backupBtn.addEventListener('click', exportToJSON);

    // Import JSON (File)
    const fileInput = document.getElementById('importFile');
    if (fileInput) {
        fileInput.addEventListener('change', handleImport);
    }

    // Restore Demo Products (New)
    const restoreBtn = document.getElementById('restoreDemoBtn');
    if (restoreBtn) {
        restoreBtn.addEventListener('click', restoreDemoData);
    }

    // Legacy Import Button (if exists)
    const importBtn = document.getElementById('importBtn');
    if (importBtn) {
        importBtn.addEventListener('click', () => {
            document.getElementById('importFile').click();
        });
    }

    // Clear data button
    const clearDataBtn = document.getElementById('clearDataBtn');
    if (clearDataBtn) clearDataBtn.addEventListener('click', handleClearData);

    // Search and filters
    document.getElementById('searchProducts').addEventListener('input', filterProducts);
    document.getElementById('filterScore').addEventListener('change', filterProducts);

    // Decline Modal Listeners
    const closeDeclineBtn = document.getElementById('closeDeclineModal');
    const cancelDeclineBtn = document.getElementById('cancelDecline');
    const confirmDeclineBtn = document.getElementById('confirmDecline');

    if (closeDeclineBtn) closeDeclineBtn.addEventListener('click', closeDeclineModal);
    if (cancelDeclineBtn) cancelDeclineBtn.addEventListener('click', closeDeclineModal);
    if (confirmDeclineBtn) confirmDeclineBtn.addEventListener('click', confirmDeclineProduct);
}

function setupScoreCalculation() {
    // Listen for changes on all form inputs
    const formInputs = [
        'buyPrice', 'sellPrice', 'weight',
        'criteriaAudience', 'criteriaProblem', 'criteriaWow',
        'criteriaCompetition', 'criteriaUpsell'
    ];

    formInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', updateScorePreview);
            element.addEventListener('change', updateScorePreview);
        }
    });
}

// ============================================
// Navigation
// ============================================

function handleNavigation(e) {
    e.preventDefault();
    const section = e.currentTarget.dataset.section || e.currentTarget.getAttribute('href')?.replace('#', '');
    if (section) {
        navigateToSection(section);
    }
}

function navigateToSection(sectionId) {
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.section === sectionId) {
            item.classList.add('active');
        }
    });

    // Show/hide sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('hidden');
    });
    const targetSection = document.getElementById(`${sectionId}-section`);
    if (targetSection) {
        targetSection.classList.remove('hidden');
    }

    // Update header
    const titles = {
        'dashboard': { title: 'Dashboard', subtitle: 'Vue d\'ensemble de vos produits' },
        'add-product': { title: 'Ajouter Produit', subtitle: 'Enregistrer un nouveau produit' },
        'products': { title: 'Mes Produits', subtitle: 'Gérer tous vos produits' },
        'validated-products': { title: 'Produits Validés', subtitle: 'Vos produits gagnants' },
        'completed-products': { title: 'Produits à Compléter', subtitle: 'Produits en attente d\'information' },
        'declined-products': { title: 'Produits Déclinés', subtitle: 'Produits non retenus' },
        'facebook-ads': { title: 'Facebook Ads', subtitle: 'Rechercher des produits gagnants' },
        'settings': { title: 'Paramètres', subtitle: 'Configurer l\'application' },
        'history': { title: 'Historique', subtitle: 'Traçabilité des actions' }
    };

    if (titles[sectionId]) {
        document.getElementById('pageTitle').textContent = titles[sectionId].title;
        document.getElementById('pageSubtitle').textContent = titles[sectionId].subtitle;
    }

    // Close mobile menu
    document.getElementById('sidebar').classList.remove('open');

    // Refresh data if needed
    if (sectionId === 'products') {
        renderProductsTable();
    }
    if (sectionId === 'history') {
        loadActivityLogs();
    }
    if (sectionId === 'declined-products') {
        renderDeclinedProducts();
    }
}

// ============================================
// Countries Rendering
// ============================================

function renderCountriesGrid(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = CONFIG.COUNTRIES.map(country => `
        <label class="country-tag" data-country="${country.code}">
            <input type="checkbox" name="countries" value="${country.code}">
            <span>${country.flag} ${country.name}</span>
        </label>
    `).join('');

    // Add click handlers
    container.querySelectorAll('.country-tag').forEach(tag => {
        tag.addEventListener('click', (e) => {
            if (e.target.type !== 'checkbox') {
                const checkbox = tag.querySelector('input');
                checkbox.checked = !checkbox.checked;
            }
            tag.classList.toggle('selected', tag.querySelector('input').checked);
        });
    });
}

function renderCountryLinks() {
    const container = document.getElementById('countryLinks');
    if (!container) return;

    container.innerHTML = CONFIG.COUNTRIES.map(country => `
        <a href="https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=${country.code}&media_type=video" 
           target="_blank" 
           class="country-link">
            ${country.flag} ${country.name}
        </a>
    `).join('');
}

function renderCountriesSettings() {
    const container = document.getElementById('countriesSettings');
    if (!container) return;

    container.innerHTML = CONFIG.COUNTRIES.map(country => `
        <span class="country-tag selected">${country.flag} ${country.name}</span>
    `).join('');
}

// ============================================
// Score Calculation
// ============================================

function calculateScore(data) {
    let score = 0;

    // Criteria-based scoring
    if (data.criteria?.audience) score += CONFIG.SCORING.audience;
    if (data.criteria?.problem) score += CONFIG.SCORING.problem;
    if (data.criteria?.wow) score += CONFIG.SCORING.wow;
    if (data.criteria?.competition) score += CONFIG.SCORING.competition;
    if (data.criteria?.upsell) score += CONFIG.SCORING.upsell;

    // Auto-calculated scoring
    if (data.buyPrice && parseFloat(data.buyPrice) <= CONFIG.THRESHOLDS.maxBuyPrice) {
        score += CONFIG.SCORING.price;
    }
    if (data.weight && parseFloat(data.weight) <= CONFIG.THRESHOLDS.maxWeight) {
        score += CONFIG.SCORING.weight;
    }

    return Math.min(score, 100);
}

function getGrade(score) {
    if (score >= 80) return 'A';
    if (score >= 60) return 'B';
    if (score >= 40) return 'C';
    return 'D';
}

function calculateProfit(buyPrice, sellPrice) {
    const buy = parseFloat(buyPrice) || 0;
    const sell = parseFloat(sellPrice) || 0;
    return sell - buy;
}

function updateScorePreview() {
    const data = getFormData();
    const score = calculateScore(data);
    const grade = getGrade(score);
    const profit = calculateProfit(data.buyPrice, data.sellPrice);

    document.getElementById('previewScore').textContent = score;
    document.getElementById('previewGrade').textContent = grade;

    const profitElement = document.getElementById('previewProfit');
    profitElement.textContent = `$${profit.toFixed(2)}`;
    profitElement.classList.toggle('negative', profit < 0);

    // Update grade color
    const gradeElement = document.getElementById('previewGrade');
    gradeElement.className = 'score-grade';
    if (grade === 'A') gradeElement.style.color = 'var(--success)';
    else if (grade === 'B') gradeElement.style.color = 'var(--info)';
    else if (grade === 'C') gradeElement.style.color = 'var(--warning)';
    else gradeElement.style.color = 'var(--danger)';
}

function resetScorePreview() {
    document.getElementById('previewScore').textContent = '0';
    document.getElementById('previewGrade').textContent = 'D';
    document.getElementById('previewProfit').textContent = '$0.00';
    document.querySelectorAll('.country-tag.selected').forEach(tag => tag.classList.remove('selected'));
}

// ============================================
// Form Handling
// ============================================

function getFormData() {
    const selectedCountries = [];
    document.querySelectorAll('#countriesGrid .country-tag.selected').forEach(tag => {
        selectedCountries.push(tag.dataset.country);
    });

    return {
        name: document.getElementById('productName').value,
        buyPrice: parseFloat(document.getElementById('buyPrice').value) || 0,
        sellPrice: parseFloat(document.getElementById('sellPrice').value) || 0,
        weight: parseFloat(document.getElementById('weight').value) || 0,
        link: document.getElementById('productLink').value,
        image: document.getElementById('productImage').value, // Add image
        countries: selectedCountries,
        criteria: {
            audience: document.getElementById('criteriaAudience').checked,
            problem: document.getElementById('criteriaProblem').checked,
            wow: document.getElementById('criteriaWow').checked,
            competition: document.getElementById('criteriaCompetition').checked,
            upsell: document.getElementById('criteriaUpsell').checked
        },
        notes: document.getElementById('notes').value
    };
}

// ============================================
// IMAGE AUTO-DETECTION (MICROLINK API)
// ============================================

async function detectProductImage(url, previewId) {
    if (!url) return;

    // Auto-fix URL if missing protocol
    if (!url.startsWith('http')) {
        url = 'https://' + url;
    }

    const previewContainer = document.getElementById(previewId);
    const hiddenInput = previewId === 'imagePreview' ? document.getElementById('productImage') : document.getElementById('editProductImage');

    // Show loading state
    previewContainer.innerHTML = '<span class="image-preview-text">🔄 Recherche image...</span>';

    try {
        // STRATEGY 1: Microlink API
        const microlinkUrl = `https://api.microlink.io?url=${encodeURIComponent(url)}&palette=true`;
        let response = await fetch(microlinkUrl);
        let data = await response.json();

        if (data.status === 'success' && data.data.image) {
            applyImage(data.data.image.url, previewContainer, hiddenInput);
            return;
        }

        // STRATEGY 2: JSONLink API (Fallback)
        previewContainer.innerHTML = '<span class="image-preview-text">🔄 Tentative secondaire...</span>';
        const jsonlinkUrl = `https://jsonlink.io/api/extract?url=${encodeURIComponent(url)}`;
        response = await fetch(jsonlinkUrl);
        data = await response.json();

        if (data.images && data.images.length > 0) {
            applyImage(data.images[0], previewContainer, hiddenInput);
            return;
        }

        // FAILURE: Reveal Manual Input
        throw new Error("No image found");

    } catch (err) {
        console.error('Auto-detection failed:', err);
        handleDetectionFailure(previewContainer, hiddenInput);
    }
}

function applyImage(imageUrl, container, input) {
    // Show image
    container.innerHTML = `<img src="${imageUrl}" class="image-preview-img" alt="Product Preview">`;
    // Update input
    input.value = imageUrl;
    if (input.type === 'text') input.type = 'hidden'; // Hide back if it was revealed
    showToast('Image détectée avec succès !');
}

function handleDetectionFailure(container, input) {
    container.innerHTML = `
        <div style="text-align:center; padding-top: 20px;">
            <span style="display:block; margin-bottom:10px; color:#e53e3e;">❌ Image protégée par le site.</span>
            <small style="color:var(--text-secondary);">Alibaba/Amazon bloquent souvent le robot automatique.</small>
        </div>
    `;

    // Reveal the manual input only if it's hidden
    if (input.type === 'hidden') {
        input.type = 'url'; // Reveal
        input.className = 'form-control';
        input.placeholder = '👉 Collez le lien de l\'image ici (Clic droit > Copier l\'adresse de l\'image)';

        // Inline styles for visibility
        input.style.display = 'block';
        input.style.width = '100%';
        input.style.marginTop = '10px';
        input.style.padding = '12px';
        input.style.border = '2px dashed #e53e3e';
        input.style.borderRadius = '8px';
        input.style.background = '#2d3748';
        input.style.color = '#fff';

        input.focus();
    }

    showToast('Mode manuel activé (Sécurité Site)', 5000);
}

function handleProductSubmit(e) {
    e.preventDefault();

    const formData = getFormData();
    const score = calculateScore(formData);
    const profit = calculateProfit(formData.buyPrice, formData.sellPrice);

    const product = {
        id: Date.now().toString(),
        ...formData,
        score,
        grade: getGrade(score),
        profit,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        validated: false // Ensure validated field exists
    };

    // Save to Supabase
    supabaseClient.from('products').insert([product])
        .then(({ error }) => {
            if (error) throw error;
            showToast('Produit ajouté (Cloud) !');
            logActivity('Ajout', formData.name);
            document.getElementById('productForm').reset();
            resetScorePreview();
            navigateToSection('products');
        })
        .catch((error) => {
            console.error("Error adding product: ", error);
            showToast('Erreur lors de l\'ajout');
        });
}

// ============================================
// Edit Product
// ============================================

function openEditModal(productId) {
    currentEditId = productId;
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Populate form
    document.getElementById('editId').value = product.id;
    document.getElementById('editProductName').value = product.name;
    document.getElementById('editBuyPrice').value = product.buyPrice;
    document.getElementById('editSellPrice').value = product.sellPrice;
    document.getElementById('editWeight').value = product.weight || '';
    document.getElementById('editProductLink').value = product.link || '';
    document.getElementById('editProductImage').value = product.image || ''; // Load image url
    document.getElementById('editNotes').value = product.notes || '';

    // Set Image Preview for Edit
    const editPreview = document.getElementById('editImagePreview');
    if (product.image) {
        editPreview.innerHTML = `<img src="${product.image}" class="image-preview-img" alt="Product Preview">`;
    } else {
        editPreview.innerHTML = '<span class="image-preview-text">Aucune image</span>';
    }

    // Set criteria
    document.getElementById('editCriteriaAudience').checked = product.criteria?.audience || false;
    document.getElementById('editCriteriaProblem').checked = product.criteria?.problem || false;
    document.getElementById('editCriteriaWow').checked = product.criteria?.wow || false;
    document.getElementById('editCriteriaCompetition').checked = product.criteria?.competition || false;
    document.getElementById('editCriteriaUpsell').checked = product.criteria?.upsell || false;

    // Set countries
    document.querySelectorAll('#editCountriesGrid .country-tag').forEach(tag => {
        const code = tag.dataset.country;
        const isSelected = product.countries?.includes(code);
        tag.classList.toggle('selected', isSelected);
        tag.querySelector('input').checked = isSelected;
    });

    // Show modal
    document.getElementById('editModal').classList.add('active');
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
    currentEditId = null;
}

function handleEditSubmit(e) {
    e.preventDefault();

    const productIndex = products.findIndex(p => p.id === currentEditId);
    if (productIndex === -1) return;

    const selectedCountries = [];
    document.querySelectorAll('#editCountriesGrid .country-tag.selected').forEach(tag => {
        selectedCountries.push(tag.dataset.country);
    });

    const updatedData = {
        name: document.getElementById('editProductName').value,
        buyPrice: parseFloat(document.getElementById('editBuyPrice').value) || 0,
        sellPrice: parseFloat(document.getElementById('editSellPrice').value) || 0,
        weight: parseFloat(document.getElementById('editWeight').value) || 0,
        link: document.getElementById('editProductLink').value,
        image: document.getElementById('editProductImage').value, // Save edited image
        countries: selectedCountries,
        criteria: {
            audience: document.getElementById('editCriteriaAudience').checked,
            problem: document.getElementById('editCriteriaProblem').checked,
            wow: document.getElementById('editCriteriaWow').checked,
            competition: document.getElementById('editCriteriaCompetition').checked,
            upsell: document.getElementById('editCriteriaUpsell').checked
        },
        notes: document.getElementById('editNotes').value
    };

    const score = calculateScore(updatedData);
    const profit = calculateProfit(updatedData.buyPrice, updatedData.sellPrice);

    // Prepare update object
    const updatePayload = {
        ...updatedData,
        score,
        grade: getGrade(score),
        profit
    };

    // Update Supabase
    supabaseClient.from('products').update(updatePayload).eq('id', currentEditId)
        .then(({ error }) => {
            if (error) throw error;

            // OPTIMISTIC UPDATE: Update local state immediately
            if (productIndex !== -1) {
                products[productIndex] = { ...products[productIndex], ...updatePayload };
            }

            renderProductsTable(); // Update UI immediately
            updateDashboard();

            showToast('Produit modifié (Cloud) !');
            logActivity('Modification', updatedData.name);
            closeEditModal();
        })
        .catch((error) => {
            console.error("Error updating product: ", error);
            showToast('Erreur lors de la modification: ' + error.message);
        });
}

// ============================================
// Delete Product
// ============================================

function deleteProduct(productId) {
    const productToDelete = products.find(p => p.id === productId);
    const productName = productToDelete ? productToDelete.name : 'Inconnu';

    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit?')) {
        supabaseClient.from('products').delete().eq('id', productId)
            .then(({ error }) => {
                if (error) throw error;
                showToast('Produit supprimé (Cloud) !');
                logActivity('Suppression', productName);
            })
            .catch((error) => {
                console.error("Error deleting product: ", error);
                showToast('Erreur lors de la suppression');
            });
    }
}

// ============================================
// Dashboard
// ============================================

function updateDashboard() {
    const today = new Date().toISOString().split('T')[0];
    const todayProducts = products.filter(p => p.date === today);

    // Update stats
    document.getElementById('totalProducts').textContent = products.length;
    document.getElementById('todayProducts').textContent = todayProducts.length;

    const avgScore = products.length > 0
        ? Math.round(products.reduce((sum, p) => sum + p.score, 0) / products.length)
        : 0;
    document.getElementById('avgScore').textContent = avgScore;

    const avgProfit = products.length > 0
        ? (products.reduce((sum, p) => sum + p.profit, 0) / products.length).toFixed(2)
        : '0.00';
    document.getElementById('avgProfit').textContent = `$${avgProfit}`;

    // Render recent products
    renderRecentProducts();
    renderTopProducts();
}

function renderRecentProducts() {
    const tbody = document.getElementById('recentProductsBody');
    const emptyState = document.getElementById('emptyDashboard');
    const table = document.getElementById('recentProductsTable');

    const recentProducts = [...products].sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
    ).slice(0, 5);

    if (recentProducts.length === 0) {
        table.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    table.style.display = 'table';
    emptyState.style.display = 'none';

    tbody.innerHTML = recentProducts.map(product => {
        const buyPrice = parseFloat(product.buyPrice) || 0;
        const sellPrice = parseFloat(product.sellPrice) || 0;
        const profit = product.profit || (sellPrice - buyPrice);

        return `
        <tr>
            <td><strong>${escapeHtml(product.name)}</strong></td>
            <td>${product.date}</td>
            <td>${formatSocialIcons(product.name)}</td>
            <td>${formatPrice(buyPrice)}</td>
            <td>${formatPrice(sellPrice)}</td>
            <td class="profit-badge ${profit >= 0 ? 'positive' : 'negative'}">
                ${formatPrice(profit)}
            </td>
            <td>
                <span class="score-badge grade-${product.grade}">
                    ${product.score} (${product.grade})
                </span>
            </td>
        </tr>
    `}).join('');
}

function renderTopProducts() {
    const container = document.getElementById('topProductsGrid');
    const emptyState = document.getElementById('emptyTopProducts');

    const topProducts = [...products]
        .sort((a, b) => b.score - a.score)
        .slice(0, 6);

    if (topProducts.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    container.innerHTML = topProducts.map((product, index) => `
        <div class="top-product-card">
            <div class="top-product-header">
                <div>
                    <div class="top-product-name">${escapeHtml(product.name)}</div>
                    <div class="top-product-countries">${formatCountries(product.countries)}</div>
                </div>
                <div class="top-product-rank">
                    ${index < 3 ? ['🥇', '🥈', '🥉'][index] : `#${index + 1}`}
                </div>
            </div>
            <div class="top-product-stats">
                <div class="top-product-stat">
                    <div class="top-product-stat-value" style="color: var(--${product.grade === 'A' ? 'success' : product.grade === 'B' ? 'info' : 'warning'})">
                        ${product.score}
                    </div>
                    <div class="top-product-stat-label">Score</div>
                </div>
                <div class="top-product-stat">
                    <div class="top-product-stat-value" style="color: ${product.profit >= 6 ? 'var(--success)' : 'var(--warning)'}">
                        $${product.profit.toFixed(2)}
                    </div>
                    <div class="top-product-stat-label">Profit</div>
                </div>
                <div class="top-product-stat">
                    <div class="top-product-stat-value">${product.grade}</div>
                    <div class="top-product-stat-label">Grade</div>
                </div>
            </div>
        </div>
    `).join('');
}

// ============================================
// Products Table
// ============================================

// Store temporary target profits for products (default 10$)
const productTargetProfits = {};

// Get target profit for a product (default 10)
function getTargetProfit(productId) {
    return productTargetProfits[productId] !== undefined ? productTargetProfits[productId] : 10;
}

// Adjust target profit for a product (using +/- buttons)
function adjustTargetProfit(productId, delta) {
    const current = getTargetProfit(productId);
    const newProfit = Math.max(0, current + delta);
    productTargetProfits[productId] = newProfit;

    // Re-render to show updates
    renderProductsTable();
    renderDeclinedProducts();
}

// Set target profit directly (from input field)
function setTargetProfit(productId, value) {
    const newProfit = Math.max(0, parseFloat(value) || 0);
    productTargetProfits[productId] = newProfit;

    // Re-render to show updates
    renderProductsTable();
    renderDeclinedProducts();
}

// Calculate dynamic selling price based on target profit and COD costs
function calculateDynamicPrice(product) {
    const targetProfit = getTargetProfit(product.id);
    const buyPrice = parseFloat(product.buyPrice) || 0;
    const weightGrams = parseFloat(product.weight) || 0;

    // Default destination (first one or CI)
    const destination = (product.countries && product.countries.length > 0) ? product.countries[0] : 'CI';
    const source = 'Chine'; // Default source

    // Get rates
    const rates = SHIPPING_DATA.exchangeRates[destination] || { USD_to_local: 630, currency: 'CFA' };
    const delivery = SHIPPING_DATA.delivery[destination] || { cost: 5000, currency: 'CFA' };
    const transport = SHIPPING_DATA.transport[destination] || {}; // Handle potential missing transport
    const transportData = transport[source] || { cost: 13, currency: 'USD' }; // Fallback

    // Costs in USD
    const buyPriceUSD = buyPrice; // Assumed USD in DB
    const adCostUSD = 10; // Default Ad Cost

    // Transport Cost
    let transportCostUSD = 0;
    const weightKg = weightGrams / 1000;

    if (transportData.currency === 'USD') {
        transportCostUSD = transportData.cost * weightKg;
    } else if (transportData.currency === 'CFA') {
        transportCostUSD = (transportData.cost * weightKg) / rates.USD_to_local;
    }

    // Delivery Cost
    let deliveryCostUSD = 0;
    if (delivery.currency === 'CFA') {
        deliveryCostUSD = delivery.cost / rates.USD_to_local;
    }

    const totalCostsUSD = buyPriceUSD + transportCostUSD + adCostUSD + deliveryCostUSD;
    const minSellPriceUSD = totalCostsUSD + targetProfit;

    return {
        minSellPriceUSD: minSellPriceUSD,
        totalCostsUSD: totalCostsUSD,
        targetProfitUSD: targetProfit,
        destination: destination,
        currency: rates.currency
    };
}

// ============================================
// Currency Conversion System
// ============================================

// Current display currency (default USD)
let currentCurrency = 'USD';

// Exchange rates (base: USD)
const EXCHANGE_RATES = {
    USD: 1,
    CFA: 630,
    MAD: 10.5,
    EUR: 0.92
};

// Set currency and re-render table
function setCurrency(currency) {
    currentCurrency = currency;

    // Update button states
    document.querySelectorAll('.currency-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.currency === currency);
    });

    // Re-render tables
    renderProductsTable();
    renderRecentProducts();

    showToast(`Devise changée: ${currency}`);
}

// Convert USD to target currency
function convertFromUSD(usdAmount, targetCurrency) {
    const amount = parseFloat(usdAmount) || 0;
    return amount * EXCHANGE_RATES[targetCurrency];
}

// Format price with currency symbol
function formatPrice(usdAmount, currency = currentCurrency) {
    const converted = convertFromUSD(usdAmount, currency);

    switch (currency) {
        case 'USD':
            return `$${converted.toFixed(2)}`;
        case 'EUR':
            return `€${converted.toFixed(2)}`;
        case 'CFA':
            return `${Math.round(converted).toLocaleString()} CFA`;
        case 'MAD':
            return `${converted.toFixed(2)} MAD`;
        default:
            return `${converted.toFixed(2)} ${currency}`;
    }
}

function renderProductsTable(filteredProducts = null) {
    const allProducts = filteredProducts || products;

    // Split products
    // Active: Not validated, Not declined, Not needs_info
    const activeProducts = allProducts.filter(p => !p.validated && !p.declined && !p.needs_info);
    // Validated: Validated, Not declined
    const validatedProducts = allProducts.filter(p => p.validated && !p.declined);
    // Completed/Request Info: Needs Info, Not declined
    const completedProducts = allProducts.filter(p => p.needs_info && !p.declined);

    // Render Active Products
    renderSpecificTable('allProductsBody', 'emptyProducts', 'allProductsTable', activeProducts, false);

    // Render Validated Products
    renderSpecificTable('validatedProductsBody', 'emptyValidatedProducts', 'validatedProductsTable', validatedProducts, true);

    // Render Completed Products (New)
    renderSpecificTable('completedProductsBody', 'emptyCompletedProducts', 'completedProductsTable', completedProducts, false, true);

    // Update count badges
    const validatedCountEl = document.getElementById('validatedCount');
    if (validatedCountEl) validatedCountEl.textContent = `${validatedProducts.length} produits`;

    const completedCountEl = document.getElementById('completedCount');
    if (completedCountEl) completedCountEl.textContent = `${completedProducts.length} produits`;

    // Update active product count display
    const activeCountEl = document.getElementById('activeProductCount');
    if (activeCountEl) {
        // Total active excluding others
        const totalActive = products.filter(p => !p.validated && !p.declined && !p.needs_info).length;
        if (filteredProducts) {
            activeCountEl.textContent = `${activeProducts.length} produits affichés sur ${totalActive} total`;
        } else {
            activeCountEl.textContent = `${activeProducts.length} produits`;
        }
    }
}

// Helper to render a specific product table
function renderSpecificTable(bodyId, emptyId, tableId, productList, isValidated, isCompleted = false) {
    const tbody = document.getElementById(bodyId);
    const emptyState = document.getElementById(emptyId);
    const table = document.getElementById(tableId);

    if (!tbody || !emptyState || !table) return;

    if (productList.length === 0) {
        table.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    table.style.display = 'table';
    emptyState.style.display = 'none';

    const sortedProducts = [...productList].sort((a, b) => {
        // Primary sort by date (newest first)
        const dateA = new Date(a.date || a.createdAt);
        const dateB = new Date(b.date || b.createdAt);
        if (dateB - dateA !== 0) return dateB - dateA;
        return String(b.id).localeCompare(String(a.id));
    });

    tbody.innerHTML = sortedProducts.map(product => {
        const buyPrice = parseFloat(product.buyPrice) || 0;
        const dynamicData = calculateDynamicPrice(product);
        const minSellPrice = dynamicData.minSellPriceUSD;
        // ACTIONS Logic
        let actionButtons = '';
        // Common Buttons
        const btnSimulator = `<button class="action-btn simulator" onclick="openSimulatorForProduct('${product.id}')" title="Simulateur COD">🧮</button>`;
        const btnEdit = `<button class="action-btn edit" onclick="openEditModal('${product.id}')" title="Modifier">✏️</button>`;
        const btnDecline = `<button class="action-btn decline" onclick="declineProduct('${product.id}')" title="Décliner" style="background: #e53e3e;">❌</button>`;

        // Request Info Button (New) - Using hourglass icon like sidebar
        const btnTitle = isCompleted ? 'Voir Info / Commentaire' : 'Demander Info (Transfert vers À compléter)';
        const btnRequestInfo = `<button class="action-btn request-info" onclick="openInfoModal('${product.id}')" title="${btnTitle}">⏳</button>`;

        if (isValidated) {
            // Validated List: COMMENT + READY FOR ADS + RETURN + LINK + Common
            const btnComment = `<button class="action-btn comment" onclick="openCommentModal('${product.id}')" title="Ajouter/Voir commentaire">💬</button>`;
            const btnReadyForAds = `<button class="action-btn ready-ads" onclick="openReadyForAdsModal('${product.id}')" title="Prêt pour test ads" style="background: #38a169;">🚀</button>`;
            const btnReturn = `<button class="action-btn return" onclick="unvalidateProduct('${product.id}')" title="Remettre en liste active">↩️</button>`;
            const btnLink = product.link ? `<a href="${product.link}" target="_blank" class="action-btn link" title="Voir le produit">🔗</a>` : '';
            actionButtons = `${btnComment} ${btnReadyForAds} ${btnSimulator} ${btnEdit} ${btnLink} ${btnReturn}`;
        } else if (isCompleted) {
            // Completed List: VIEW INFO + RETURN (instead of link) + Common
            const btnReturn = `<button class="action-btn return" onclick="resolveInfo('${product.id}')" title="Retour vers Mes Produits">↩️</button>`;
            // Re-use btnRequestInfo as "View Info" (it opens the same modal)
            actionButtons = `${btnRequestInfo} ${btnSimulator} ${btnEdit} ${btnReturn} ${btnDecline}`;
        } else {
            // Main Active List: REQUEST INFO + VALIDATE + DELETE + DECLINE
            const btnValidate = `<button class="action-btn validate" onclick="validateProduct('${product.id}')" title="Valider ce produit">✅</button>`;
            const btnDelete = `<button class="action-btn delete" onclick="deleteProduct('${product.id}')" title="Supprimer définitivement" style="background: #e53e3e;">🗑️</button>`;
            actionButtons = `${btnRequestInfo} ${btnSimulator} ${btnEdit} ${btnValidate} ${btnDelete} ${btnDecline}`;
        }

        // Special column for Completed List (Comment instead of Networks/Reseaux if desired, or just show everything)
        // For now user requested table consistency, but we need to show the comment.
        // Let's replace the 3rd column (Social Icons) or add it? The user asked for "Products to Complete" table.
        // In the HTML for completedProductsTable i added a specific header "Commentaire / Info manquante" at index 2 (3rd col).

        let thirdColumnContent = formatSocialIcons(product.name); // Default for active products
        if (isValidated) {
            // Show notes/comment for validated products
            thirdColumnContent = product.notes
                ? `<span class="product-comment" title="${escapeHtml(product.notes)}">${escapeHtml(product.notes.substring(0, 50))}${product.notes.length > 50 ? '...' : ''}</span>`
                : '<span style="color: var(--text-muted);">-</span>';
        } else if (isCompleted) {
            // Show info_request/comment for completed products
            const comment = product.info_request || product.notes;
            thirdColumnContent = comment
                ? `<span class="product-comment" title="${escapeHtml(comment)}">${escapeHtml(comment.substring(0, 50))}${comment.length > 50 ? '...' : ''}</span>`
                : '<span style="color: var(--text-muted);">-</span>';
        }

        return `
        <tr>
            <td>
                ${product.image
                ? `<img src="${product.image}" class="product-thumbnail" alt="${escapeHtml(product.name)}" onclick="window.open('${product.image}', '_blank')">`
                : `<div class="product-thumbnail-placeholder">${product.name.charAt(0)}</div>`
            }
            </td>
            <td><strong>${escapeHtml(product.name)}</strong></td>
            <td>${product.date}</td>
            <td>${thirdColumnContent}</td>
            <td>${product.link ? `<a href="${product.link}" target="_blank" class="chosen-product-link" title="${product.link}">🔗 Voir</a>` : '<span style="color: var(--text-muted);">-</span>'}</td>
            <td>${formatPrice(buyPrice)}</td>
            <td>${product.weight || '-'}</td>
            <td>${formatPrice(minSellPrice)}</td>
            
            <td class="profit-control-cell">
                <div class="profit-control-wrapper normal">
                     <button class="profit-btn" onclick="adjustTargetProfit('${product.id}', -1)">-</button>
                    <input type="number" class="profit-input" value="${dynamicData.targetProfitUSD}" 
                        min="0" step="1" 
                        onchange="setTargetProfit('${product.id}', this.value)"
                        style="width: 60px; text-align: center; border: none; background: transparent; font-weight: bold; font-size: 14px; color: inherit;">
                    <button class="profit-btn" onclick="adjustTargetProfit('${product.id}', 1)">+</button>
                </div>
                <small class="profit-label">Profit Cible ($)</small>
            </td>
            <td>${actionButtons}</td>
        </tr>
    `}).join('');
}

// Function to validate a product
// Function to validate a product
// Function to validate a product
function validateProduct(productId) {
    // 1. Optimistic Update (Immediate Feedback)
    const product = products.find(p => p.id === productId);
    if (product) {
        product.validated = true;
        renderProductsTable(); // Move instantly from Active to Validated list
        updateDashboard();
        showToast('✅ Produit validé !');
        logActivity('Validation', product.name);
    }

    // 2. Send to Cloud (Background)
    supabaseClient.from('products').update({ validated: true }).eq('id', productId)
        .then(({ error }) => {
            if (error) {
                console.error("Error validating product: ", error);
                showToast('Erreur synchro cloud, refraîchissez');
                // Revert if needed, but for validation simple toast is usually enough
            }
        });
}

// Function to permanently delete a product
function deleteProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (!confirm(`⚠️ Supprimer définitivement "${product.name}" ?\n\nCette action est irréversible.`)) return;

    // 1. Optimistic Update (Immediate Feedback)
    products = products.filter(p => p.id !== productId);
    renderProductsTable();
    updateDashboard();
    showToast('🗑️ Produit supprimé !');
    logActivity('Suppression', product.name);

    // 2. Send to Cloud (Background)
    supabaseClient.from('products').delete().eq('id', productId)
        .then(({ error }) => {
            if (error) {
                console.error("Error deleting product: ", error);
                showToast('Erreur synchro cloud, refraîchissez');
            }
        });
}

// Function to decline a product (opens modal)
let currentDeclineId = null;

function declineProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    currentDeclineId = productId;
    document.getElementById('declineProductName').textContent = `Produit: "${product.name}"`;
    document.getElementById('declineReason').value = '';
    document.getElementById('declineModal').classList.add('active');
}

function closeDeclineModal() {
    document.getElementById('declineModal').classList.remove('active');
    currentDeclineId = null;
}

function confirmDeclineProduct() {
    if (!currentDeclineId) return;

    const product = products.find(p => p.id === currentDeclineId);
    if (!product) return;

    const reason = document.getElementById('declineReason').value.trim() || 'Aucune raison spécifiée';

    // 1. Optimistic Update
    product.declined = true;
    product.declineReason = reason;
    product.declinedAt = new Date().toISOString();
    renderProductsTable();
    renderDeclinedProducts();
    updateDashboard();
    showToast('❌ Produit décliné');
    logActivity('Décliné', product.name + (reason !== 'Aucune raison spécifiée' ? ' - ' + reason : ''));

    // 2. Send to Cloud
    supabaseClient.from('products').update({
        declined: true,
        declineReason: reason,
        declinedAt: new Date().toISOString()
    }).eq('id', currentDeclineId)
        .then(({ error }) => {
            if (error) console.error('Decline error:', error);
            closeDeclineModal();
        });
}

// ============================================
// Request Info / Completed Products Workflow
// ============================================

let currentInfoId = null;

function openInfoModal(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    currentInfoId = productId;
    document.getElementById('infoProductName').textContent = `Produit: "${product.name}"`;
    // Pre-fill with existing comment (snake_case from database)
    document.getElementById('infoComment').value = product.info_request || '';
    document.getElementById('infoModal').classList.add('active');
}

function closeInfoModal() {
    document.getElementById('infoModal').classList.remove('active');
    currentInfoId = null;
}

// Event Listeners for Info Modal
document.getElementById('closeInfoModal')?.addEventListener('click', closeInfoModal);
document.getElementById('cancelInfo')?.addEventListener('click', closeInfoModal);
document.getElementById('confirmRequestInfo')?.addEventListener('click', confirmRequestInfo);

function confirmRequestInfo() {
    if (!currentInfoId) return;

    const product = products.find(p => p.id === currentInfoId);
    if (!product) return;

    const productId = currentInfoId; // Copy to local variable
    const comment = document.getElementById('infoComment').value.trim() || 'Info manquante';

    // 1. Optimistic Update (Immediate Feedback)
    product.needs_info = true;
    product.info_request = comment; // Store comment locally
    renderProductsTable();
    updateDashboard();
    showToast('⏳ Demande Info enregistrée !');
    logActivity('Demande Info', product.name);

    // Switch to Completed Tab to show where it went
    document.querySelector('.nav-item[data-section="completed-products"]').click();
    closeInfoModal();

    // 2. Send to Cloud (Background)
    supabaseClient.from('products').update({ needs_info: true, info_request: comment }).eq('id', productId)
        .then(({ error }) => {
            if (error) {
                console.error("Error requesting info: ", error);
                showToast('Erreur synchro cloud, refraîchissez');
            }
        });
}

function resolveInfo(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (!confirm('Avez-vous complété les informations pour ce produit ? Il retournera dans "Mes Produits".')) return;

    // 1. Optimistic Update (Immediate Feedback) - EXACTLY like validateProduct
    product.needs_info = false;
    renderProductsTable(); // Move instantly from Completed to Active list
    updateDashboard();
    showToast('✅ Info complétée !');
    logActivity('Info Complétée', product.name);

    // Switch back to Mes Produits
    document.querySelector('.nav-item[data-section="products"]').click();

    // 2. Send to Cloud (Background) - EXACTLY like validateProduct
    supabaseClient.from('products').update({ needs_info: false }).eq('id', productId)
        .then(({ error }) => {
            if (error) {
                console.error("Error resolving info: ", error);
                showToast('Erreur synchro cloud, refraîchissez');
            }
        });
}

// ============================================
// Comment Modal for Validated Products
// ============================================

let currentCommentId = null;

function openCommentModal(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    currentCommentId = productId;
    document.getElementById('commentProductName').textContent = `Produit: "${product.name}"`;
    // Pre-fill with existing notes
    document.getElementById('productComment').value = product.notes || '';
    document.getElementById('commentModal').classList.add('active');
}

function closeCommentModal() {
    document.getElementById('commentModal').classList.remove('active');
    currentCommentId = null;
}

function saveComment() {
    if (!currentCommentId) return;

    const product = products.find(p => p.id === currentCommentId);
    if (!product) return;

    const productId = currentCommentId;
    const comment = document.getElementById('productComment').value.trim();

    // 1. Optimistic Update
    product.notes = comment;
    renderProductsTable();
    showToast('💬 Commentaire sauvegardé !');
    logActivity('Commentaire', product.name);
    closeCommentModal();

    // 2. Send to Cloud
    supabaseClient.from('products').update({ notes: comment }).eq('id', productId)
        .then(({ error }) => {
            if (error) {
                console.error("Error saving comment: ", error);
                showToast('Erreur synchro cloud, refraîchissez');
            }
        });
}

// Event Listeners for Comment Modal
document.getElementById('closeCommentModal')?.addEventListener('click', closeCommentModal);
document.getElementById('cancelComment')?.addEventListener('click', closeCommentModal);
document.getElementById('saveComment')?.addEventListener('click', saveComment);

// Function to return a validated product to active list
function unvalidateProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // 1. Optimistic Update
    product.validated = false;
    renderProductsTable();
    updateDashboard();
    showToast('↩️ Produit remis en liste active');
    logActivity('Annulation validation', product.name);

    // 2. Send to Cloud
    supabaseClient.from('products').update({ validated: false }).eq('id', productId)
        .then(({ error }) => {
            if (error) console.error('Unvalidate error:', error);
        });
}

// Function to restore a declined product to active list
function restoreProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // 1. Optimistic Update
    product.declined = false;
    product.declineReason = null;
    product.declinedAt = null;
    renderProductsTable();
    renderDeclinedProducts();
    updateDashboard();
    showToast('♻️ Produit restauré');
    logActivity('Restauration', product.name);

    // 2. Send to Cloud
    supabaseClient.from('products').update({
        declined: false,
        declineReason: null,
        declinedAt: null
    }).eq('id', productId)
        .then(({ error }) => {
            if (error) console.error('Restore error:', error);
        });
}

// Render declined products table
function renderDeclinedProducts() {
    const declinedProducts = products.filter(p => p.declined);
    const tbody = document.getElementById('declinedProductsBody');
    const emptyState = document.getElementById('emptyDeclinedProducts');
    const table = document.getElementById('declinedProductsTable');

    if (!tbody || !table) return;

    // Update count badge
    const countEl = document.getElementById('declinedCount');
    if (countEl) countEl.textContent = `${declinedProducts.length} produits`;

    if (declinedProducts.length === 0) {
        table.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    table.style.display = 'table';
    if (emptyState) emptyState.style.display = 'none';

    tbody.innerHTML = declinedProducts.map(product => {
        const buyPrice = parseFloat(product.buyPrice) || 0;
        const weight = product.weight || '-';

        // Country flags
        const countryFlags = product.countries && product.countries.length > 0
            ? product.countries.map(code => {
                const country = CONFIG.COUNTRIES.find(c => c.code === code);
                return country ? country.flag : '';
            }).join(' ')
            : '-';

        // Action buttons
        const btnSimulator = `<button class="action-btn simulator" onclick="openSimulatorForProduct('${product.id}')" title="Simulateur COD">🧮</button>`;
        const btnEdit = `<button class="action-btn edit" onclick="openEditModal('${product.id}')" title="Modifier">✏️</button>`;
        const btnLink = product.link ? `<a href="${product.link}" target="_blank" class="action-btn link" title="Voir le produit">🔗</a>` : '';
        const btnRestore = `<button class="action-btn restore" onclick="restoreProduct('${product.id}')" title="Restaurer" style="background: #48bb78;">♻️</button>`;

        return `
        <tr>
            <td><strong>${escapeHtml(product.name)}</strong></td>
            <td>${product.date || '-'}</td>
            <td>${countryFlags}</td>
            <td>${formatPrice(buyPrice)}</td>
            <td>${weight}g</td>
            <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(product.declineReason || '-')}</td>
            <td>${btnSimulator} ${btnEdit} ${btnLink} ${btnRestore}</td>
        </tr>
        `;
    }).join('');
}

function filterProducts() {
    const searchTerm = document.getElementById('searchProducts').value.toLowerCase();
    const gradeFilter = document.getElementById('filterScore').value;

    let filtered = products;

    if (searchTerm) {
        filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(searchTerm) ||
            (p.countries && p.countries.some(c => {
                const country = CONFIG.COUNTRIES.find(co => co.code === c);
                return country && country.name.toLowerCase().includes(searchTerm);
            }))
        );
    }

    if (gradeFilter !== 'all') {
        filtered = filtered.filter(p => p.grade === gradeFilter);
    }

    renderProductsTable(filtered);
}

// ============================================
// Data Persistence
// ============================================

function saveProducts() {
    // Deprecated: Data is managed by Supabase
}

function loadProducts() {
    // 1. Migration: Upload LocalStorage data to Supabase if exists
    const stored = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (stored) {
        try {
            const localProducts = JSON.parse(stored);
            if (localProducts.length > 0) {
                showToast('Migration vers Supabase en cours...');
                // Ensure all products have IDs
                const productsToUpload = localProducts.map(p => ({
                    ...p,
                    id: p.id || Date.now().toString() + Math.random().toString(36).substr(2, 5)
                }));

                supabaseClient.from('products').insert(productsToUpload)
                    .then(({ error }) => {
                        if (!error) {
                            console.log('Migration complete');
                            localStorage.removeItem(CONFIG.STORAGE_KEY);
                            showToast('Migration terminée ! Données dans le Cloud.');
                        } else {
                            console.error('Migration partial error:', error);
                            showToast('Erreur chargement exemples: ' + error.message);
                            // Keep local storage if error, to be safe
                        }
                    });
            }
        } catch (e) {
            console.error('Migration error:', e);
        }
    }

    // 2. Initial Load
    supabaseClient.from('products').select('*')
        .then(({ data, error }) => {
            if (error) console.error('Error loading:', error);
            else {
                products = data || [];
                updateDashboard();
                renderProductsTable();

                // Update badge
                const validCount = products.filter(p => p.validated).length;
                const badge = document.getElementById('validatedCount');
                if (badge) badge.textContent = `${validCount} produits`;
            }
        });

    // 3. Real-time Subscription
    supabaseClient.channel('products')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, payload => {
            console.log('Change received!', payload);
            // Refresh data on any change
            supabaseClient.from('products').select('*').then(({ data }) => {
                products = data || [];
                updateDashboard();
                renderProductsTable();

                const validCount = products.filter(p => p.validated).length;
                const badge = document.getElementById('validatedCount');
                if (badge) badge.textContent = `${validCount} produits`;
            });
        })
        .subscribe();
}

// ============================================
// Export to CSV
// ============================================

function exportToCSV() {
    if (products.length === 0) {
        showToast('Aucun produit à exporter!');
        return;
    }

    // CSV Headers matching the required format
    const headers = [
        'Product name',
        'Date',
        'Pays',
        'Prix d\'achat',
        'Poids',
        'Prix de vente',
        'Profit',
        'Score',
        'Note',
        'Lien produit'
    ];

    const rows = products.map(p => [
        `"${p.name.replace(/"/g, '""')}"`,
        p.date,
        `"${formatCountriesForCSV(p.countries)}"`,
        p.buyPrice,
        p.weight || '',
        p.sellPrice,
        p.profit.toFixed(2),
        `${p.score} (${p.grade})`,
        `"${(p.notes || '').replace(/"/g, '""')}"`,
        p.link || ''
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    // Create and download file
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `products_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Export CSV réussi!');
}

function formatCountriesForCSV(codes) {
    if (!codes || codes.length === 0) return '';
    return codes.map(code => {
        const country = CONFIG.COUNTRIES.find(c => c.code === code);
        return country ? country.name : code;
    }).join(', ');
}

function exportToJSON() {
    if (products.length === 0) {
        showToast('Aucun produit à exporter!');
        return;
    }

    const dataStr = JSON.stringify(products, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_products_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Sauvegarde JSON réussie!');
}

// ============================================
// Import Data
// ============================================

function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
        try {
            const imported = JSON.parse(event.target.result);
            if (Array.isArray(imported) && imported.length > 0) {
                showToast(`Import de ${imported.length} produits vers Supabase...`);

                const productsToImport = imported.map(p => ({
                    ...p,
                    id: p.id || (Date.now().toString() + Math.random().toString(36).substr(2, 5))
                }));

                supabaseClient.from('products').insert(productsToImport)
                    .then(({ error }) => {
                        if (error) throw error;
                        showToast('Import terminé avec succès (Cloud) !');
                    })
                    .catch(error => {
                        console.error("Import failed: ", error);
                        showToast('Erreur lors de l\'import');
                    });
            }
        } catch (err) {
            console.error(err);
            showToast('Erreur lors de l\'import!');
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

// ============================================
// Clear Data
// ============================================

function handleClearData() {
    if (confirm('⚠️ ATTENTION : Cela va supprimer TOUTES les données du Cloud pour tout le monde. Continuer ?')) {
        // Supabase doesn't support 'delete all' easily without a where clause, so we use a trick or delete by ID
        // For safety/simplicity in this app, we'll fetch all IDs and delete them (not efficient for huge data but fine here)
        supabaseClient.from('products').select('id').then(({ data }) => {
            const ids = data.map(p => p.id);
            if (ids.length > 0) {
                supabaseClient.from('products').delete().in('id', ids)
                    .then(({ error }) => {
                        if (error) throw error;
                        showToast('Base de données Cloud entièrement effacée !');
                    });
            } else {
                showToast('Déjà vide !');
            }
        });
    }
}

// ============================================
// Utilities
// ============================================

function restoreDemoData() {
    if (confirm('Voulez-vous recharger les 60 produits d\'exemple dans Supabase ?')) {
        showToast('Restauration en cours...');
        const samplesToInsert = SAMPLE_PRODUCTS.map(p => ({
            ...p,
            validated: false
        }));

        supabaseClient.from('products').insert(samplesToInsert)
            .then(({ error }) => {
                if (error) {
                    console.error(error);
                    showToast('Erreur: ' + error.message);
                } else {
                    showToast('Succès ! Produits restaurés.');
                    loadProducts(); // Refresh view
                }
            });
    }
}

function formatCountries(codes) {
    if (!codes || codes.length === 0) return '-';
    return codes.map(code => {
        const country = CONFIG.COUNTRIES.find(c => c.code === code);
        return country ? country.flag : code;
    }).join(' ');
}

// Generate social media search icons for a product
function formatSocialIcons(productName) {
    if (!productName) return '-';

    // Encode product name for URL
    const encodedName = encodeURIComponent(productName);

    // Social media search URLs
    const socialLinks = [
        {
            name: 'YouTube',
            class: 'youtube',
            icon: '▶',
            url: `https://www.youtube.com/results?search_query=${encodedName}`
        },
        {
            name: 'TikTok',
            class: 'tiktok',
            icon: '♪',
            url: `https://www.tiktok.com/search?q=${encodedName}`
        },
        {
            name: 'Facebook Ads',
            class: 'facebook-ads',
            icon: '📢',
            url: `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&q=${encodedName}&media_type=video`
        },
        {
            name: 'Google',
            class: 'google',
            icon: '🔍',
            url: `https://www.google.com/search?q=${encodedName}+dropshipping`
        },
        {
            name: 'AliExpress',
            class: 'aliexpress',
            icon: '🛒',
            url: `https://www.aliexpress.com/wholesale?SearchText=${encodedName}`
        },
        {
            name: 'Alibaba',
            class: 'alibaba',
            icon: '🏭',
            url: `https://www.alibaba.com/trade/search?SearchText=${encodedName}`
        }
    ];

    return `<div class="social-icons">
        ${socialLinks.map(social => `
            <a href="${social.url}" 
               target="_blank" 
               class="social-icon ${social.class}" 
               title="Rechercher sur ${social.name}">
                ${social.icon}
            </a>
        `).join('')}
    </div>`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    toastMessage.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ============================================
// COD Profit Simulator
// ============================================

// Shipping costs data (from user's configuration)
const SHIPPING_DATA = {
    // Transport costs per kg
    transport: {
        CI: { // Côte d'Ivoire
            'Maroc-Avion': { cost: 80, currency: 'MAD', perKg: true },
            'Maroc-Camion': { cost: 30, currency: 'MAD', perKg: true },
            'Chine': { cost: 10000, currency: 'CFA', perKg: true },
            'Dubai': { cost: 8500, currency: 'CFA', perKg: true }
        },
        BF: { // Burkina Faso
            'Maroc-Avion': { cost: 70, currency: 'MAD', perKg: true },
            'Maroc-Camion': { cost: 23, currency: 'MAD', perKg: true },
            'Chine': { cost: 11000, currency: 'CFA', perKg: true },
            'Dubai': { cost: 8500, currency: 'CFA', perKg: true }
        },
        SN: { // Sénégal
            'Maroc-Avion': { cost: 70, currency: 'MAD', perKg: true },
            'Chine': { cost: 10000, currency: 'CFA', perKg: true },
            'Dubai': { cost: 8500, currency: 'CFA', perKg: true }
        },
        NE: { // Niger
            'Maroc-Avion': { cost: 70, currency: 'MAD', perKg: true },
            'Maroc-Camion': { cost: 23, currency: 'MAD', perKg: true },
            'Chine': { cost: 12000, currency: 'CFA', perKg: true },
            'Dubai': { cost: 10000, currency: 'CFA', perKg: true }
        },
        ML: { // Mali
            'Maroc-Avion': { cost: 75, currency: 'MAD', perKg: true },
            'Maroc-Camion': { cost: 25, currency: 'MAD', perKg: true },
            'Chine': { cost: 12000, currency: 'CFA', perKg: true },
            'Dubai': { cost: 8000, currency: 'CFA', perKg: true }
        },
        BJ: { // Bénin
            'Chine': { cost: 12000, currency: 'CFA', perKg: true },
            'Dubai': { cost: 8500, currency: 'CFA', perKg: true }
        },
        TG: { // Togo
            'Chine': { cost: 11000, currency: 'CFA', perKg: true },
            'Dubai': { cost: 8000, currency: 'CFA', perKg: true }
        },
        GA: { // Gabon
            'Maroc-Avion': { cost: 82.5, currency: 'MAD', perKg: true },
            'Chine': { cost: 13000, currency: 'CFA', perKg: true },
            'Dubai': { cost: 12000, currency: 'CFA', perKg: true }
        },
        TD: { // Chad
            'Chine': { cost: 12500, currency: 'CFA', perKg: true },
            'Dubai': { cost: 9500, currency: 'CFA', perKg: true }
        },
        GN: { // Guinée Conakry
            'Maroc-Avion': { cost: 80, currency: 'MAD', perKg: true },
            'Chine': { cost: 170000, currency: 'GNF', perKg: true },
            'Dubai': { cost: 135000, currency: 'GNF', perKg: true }
        }
    },

    // COD delivery fees
    delivery: {
        CI: { cost: 5000, currency: 'CFA' },
        BF: { cost: 5000, currency: 'CFA' },
        SN: { cost: 5000, currency: 'CFA' },
        NE: { cost: 5000, currency: 'CFA' },
        ML: { cost: 5000, currency: 'CFA' },
        BJ: { cost: 5000, currency: 'CFA' },
        TG: { cost: 5000, currency: 'CFA' },
        GA: { cost: 6500, currency: 'CFA' },
        TD: { cost: 6500, currency: 'CFA' },
        GN: { cost: 85000, currency: 'GNF' }
    },

    // Exchange rates
    exchangeRates: {
        CI: { MAD_to_local: 66, USD_to_local: 630, currency: 'CFA' },
        BF: { MAD_to_local: 66, USD_to_local: 630, currency: 'CFA' },
        SN: { MAD_to_local: 66, USD_to_local: 630, currency: 'CFA' },
        NE: { MAD_to_local: 66, USD_to_local: 630, currency: 'CFA' },
        ML: { MAD_to_local: 66, USD_to_local: 630, currency: 'CFA' },
        BJ: { MAD_to_local: 66, USD_to_local: 630, currency: 'CFA' },
        TG: { MAD_to_local: 66, USD_to_local: 630, currency: 'CFA' },
        GA: { MAD_to_local: 70, USD_to_local: 680, currency: 'CFA' },
        TD: { MAD_to_local: 70, USD_to_local: 680, currency: 'CFA' },
        GN: { MAD_to_local: 1100, USD_to_local: 10090, currency: 'GNF' }
    }
};

// Country names for display
const COUNTRY_NAMES = {
    CI: "Côte d'Ivoire",
    BF: "Burkina Faso",
    SN: "Sénégal",
    NE: "Niger",
    ML: "Mali",
    BJ: "Bénin",
    TG: "Togo",
    GA: "Gabon",
    TD: "Tchad",
    GN: "Guinée Conakry"
};

// Initialize simulator when page loads
function initializeSimulator() {
    const calculateBtn = document.getElementById('calculateProfit');
    const toggleBtn = document.getElementById('toggleShippingData');

    if (calculateBtn) {
        calculateBtn.addEventListener('click', calculateCODProfit);
    }

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const table = document.getElementById('shippingDataTable');
            table.style.display = table.style.display === 'none' ? 'block' : 'none';
        });
    }

    // Render shipping data table
    renderShippingDataTable();
}

// Open simulator with product data pre-filled
function openSimulatorForProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Navigate to simulator section
    navigateToSection('simulator');

    // Pre-fill the form with product data
    setTimeout(() => {
        // Product name
        const nameInput = document.getElementById('simProductName');
        if (nameInput) nameInput.value = product.name;

        // Buy price (USD)
        const buyPriceInput = document.getElementById('simBuyPrice');
        const buyCurrencySelect = document.getElementById('simBuyCurrency');
        if (buyPriceInput) buyPriceInput.value = product.buyPrice;
        if (buyCurrencySelect) buyCurrencySelect.value = 'USD';

        // Weight (grams)
        const weightInput = document.getElementById('simWeight');
        if (weightInput) weightInput.value = product.weight || '';

        // Quantity
        const quantityInput = document.getElementById('simQuantity');
        if (quantityInput) quantityInput.value = 1;

        // Set default source to Chine (most common)
        const sourceSelect = document.getElementById('simSource');
        if (sourceSelect) sourceSelect.value = 'Chine';

        // Set first country from product countries if available
        const destSelect = document.getElementById('simDestination');
        if (destSelect && product.countries && product.countries.length > 0) {
            destSelect.value = product.countries[0];
        }

        // ============================================
        // Use Dynamic Calculation Data
        // ============================================
        const dynamicData = calculateDynamicPrice(product);

        // Set Target Profit (from list adjustment)
        const targetProfitInput = document.getElementById('simTargetProfit');
        const targetCurrencySelect = document.getElementById('simTargetCurrency');
        if (targetProfitInput) targetProfitInput.value = dynamicData.targetProfitUSD;
        if (targetCurrencySelect) targetCurrencySelect.value = 'USD';

        // Set Sell Price (Dynamic Min Price converted to local currency)
        const sellPriceInput = document.getElementById('simSellPrice');
        const sellCurrencySelect = document.getElementById('simSellCurrency');

        if (sellPriceInput) {
            const currency = dynamicData.currency || 'CFA';
            let sellPriceValue = dynamicData.minSellPriceUSD;

            // Convert USD to local currency for display
            if (currency === 'CFA') sellPriceValue *= 630;
            else if (currency === 'MAD') sellPriceValue *= 10.5;
            else if (currency === 'GNF') sellPriceValue *= 10090;
            else if (currency === 'EUR') sellPriceValue *= 0.92;

            // Smart rounding
            if (currency === 'CFA' || currency === 'GNF') {
                sellPriceValue = Math.ceil(sellPriceValue / 50) * 50;
            } else {
                sellPriceValue = parseFloat(sellPriceValue.toFixed(2));
            }

            sellPriceInput.value = sellPriceValue;

            if (sellCurrencySelect) {
                sellCurrencySelect.value = currency;
                sellCurrencySelect.setAttribute('data-prev', currency);
            }
        }

        // Show toast notification
        showToast(`📊 Simulateur: Profit cible $${dynamicData.targetProfitUSD}`);

        // Scroll to simulator form
        document.querySelector('.simulator-container')?.scrollIntoView({ behavior: 'smooth' });

        // Trigger calculation
        setTimeout(autoCalculate, 500);
    }, 100);
}

// Convert input when currency changes
function convertInputCurrency(selectElement, inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;

    const oldCurrency = selectElement.getAttribute('data-prev') || 'USD';
    const newCurrency = selectElement.value;
    const value = parseFloat(input.value) || 0;

    if (oldCurrency === newCurrency) return;

    // Convert to USD first (base)
    let valueUSD = value;
    if (oldCurrency !== 'USD') {
        if (oldCurrency === 'CFA') valueUSD = value / 630;
        else if (oldCurrency === 'MAD') valueUSD = value / 10.5;
        else if (oldCurrency === 'EUR') valueUSD = value / 0.92;
        else if (oldCurrency === 'GNF') valueUSD = value / 10090;
    }

    // Convert USD to new currency
    let newValue = valueUSD;
    if (newCurrency !== 'USD') {
        if (newCurrency === 'CFA') newValue = valueUSD * 630;
        else if (newCurrency === 'MAD') newValue = valueUSD * 10.5;
        else if (newCurrency === 'EUR') newValue = valueUSD * 0.92;
        else if (newCurrency === 'GNF') newValue = valueUSD * 10090;
    }

    // Update input value
    if (newCurrency === 'CFA' || newCurrency === 'GNF') {
        input.value = Math.round(newValue);
    } else {
        input.value = newValue.toFixed(2);
    }

    // Update previous currency attribute
    selectElement.setAttribute('data-prev', newCurrency);

    // Trigger calculation
    autoCalculate();
}

// Calculate COD profit
function calculateCODProfit() {
    // Get form values
    const buyPriceUSD = parseFloat(document.getElementById('simBuyPrice').value) || 0;
    const weightGrams = parseFloat(document.getElementById('simWeight').value) || 0;
    const source = document.getElementById('simSource').value;
    const destination = document.getElementById('simDestination').value;
    const sellPriceLocal = parseFloat(document.getElementById('simSellPrice').value) || 0;
    const adCostUSD = parseFloat(document.getElementById('simAdCost').value) || 0;
    const quantity = parseInt(document.getElementById('simQuantity').value) || 1;

    // Get rates for destination
    const rates = SHIPPING_DATA.exchangeRates[destination];
    const delivery = SHIPPING_DATA.delivery[destination];
    const transport = SHIPPING_DATA.transport[destination];

    if (!rates || !delivery) {
        showToast('Erreur: Destination non supportée');
        return;
    }

    // Check if source is available for destination
    if (!transport[source]) {
        showToast(`Erreur: La source "${source}" n'est pas disponible pour ${COUNTRY_NAMES[destination]}`);
        return;
    }

    const localCurrency = rates.currency;
    const transportData = transport[source];

    // Calculate costs in local currency
    // 1. Buy price (convert USD to local)
    const buyPriceLocal = buyPriceUSD * rates.USD_to_local;

    // 2. Transport cost (per kg)
    const weightKg = weightGrams / 1000;
    let transportCostLocal = 0;
    if (transportData.currency === 'MAD') {
        transportCostLocal = transportData.cost * weightKg * rates.MAD_to_local;
    } else {
        transportCostLocal = transportData.cost * weightKg;
    }

    // 3. COD delivery fee
    const deliveryCostLocal = delivery.cost;

    // 4. Ad cost (convert USD to local)
    const adCostLocal = adCostUSD * rates.USD_to_local;

    // Total cost
    const totalCostLocal = buyPriceLocal + transportCostLocal + deliveryCostLocal + adCostLocal;

    // Profit
    const profitLocal = sellPriceLocal - totalCostLocal;

    // Show results
    document.getElementById('simulatorResults').style.display = 'block';

    // Main profit
    const resultProfit = document.getElementById('resultProfit');
    resultProfit.textContent = `${formatNumber(profitLocal)} ${localCurrency}`;
    resultProfit.className = profitLocal >= 0 ? 'result-value' : 'result-value negative';

    // Indicator
    const indicator = document.getElementById('resultIndicator');
    if (profitLocal >= 0) {
        indicator.className = 'result-indicator';
        indicator.innerHTML = '<span class="indicator-icon">✓</span><span class="indicator-text">Rentable</span>';
    } else {
        indicator.className = 'result-indicator danger';
        indicator.innerHTML = '<span class="indicator-icon">✗</span><span class="indicator-text">Non Rentable</span>';
    }

    // Breakdown
    document.getElementById('breakdownBuy').textContent = `${formatNumber(buyPriceLocal)} ${localCurrency}`;
    document.getElementById('breakdownShipping').textContent = `${formatNumber(transportCostLocal)} ${localCurrency}`;
    document.getElementById('breakdownCOD').textContent = `${formatNumber(deliveryCostLocal)} ${localCurrency}`;
    document.getElementById('breakdownAd').textContent = `${formatNumber(adCostLocal)} ${localCurrency}`;
    document.getElementById('breakdownTotal').textContent = `${formatNumber(totalCostLocal)} ${localCurrency}`;
    document.getElementById('breakdownSell').textContent = `${formatNumber(sellPriceLocal)} ${localCurrency}`;

    // Exchange rates used
    document.getElementById('exchangeInfo').innerHTML = `
        <div class="exchange-rate">
            <span>1 USD = </span><strong>${rates.USD_to_local} ${localCurrency}</strong>
        </div>
        <div class="exchange-rate">
            <span>1 MAD = </span><strong>${rates.MAD_to_local} ${localCurrency}</strong>
        </div>
        <div class="exchange-rate">
            <span>Transport ${source}: </span><strong>${transportData.cost} ${transportData.currency}/kg</strong>
        </div>
    `;

    // Scroll to results
    document.getElementById('simulatorResults').scrollIntoView({ behavior: 'smooth' });
}

// Format number with thousands separator
function formatNumber(num) {
    return Math.round(num).toLocaleString('fr-FR');
}

// Render shipping data reference table
function renderShippingDataTable() {
    const tbody = document.getElementById('shippingDataBody');
    if (!tbody) return;

    let html = '';

    Object.keys(SHIPPING_DATA.transport).forEach(countryCode => {
        const countryName = COUNTRY_NAMES[countryCode];
        const transportData = SHIPPING_DATA.transport[countryCode];
        const deliveryData = SHIPPING_DATA.delivery[countryCode];

        let firstRow = true;
        Object.keys(transportData).forEach(source => {
            const data = transportData[source];
            html += `
                <tr>
                    ${firstRow ? `<td rowspan="${Object.keys(transportData).length}"><strong>${countryName}</strong></td>` : ''}
                    <td>${source.replace('-', ' ')}</td>
                    <td>${source.includes('Avion') ? '✈️ Avion' : source.includes('Camion') ? '🚛 Camion' : '🚢 Maritime'}</td>
                    <td>${data.cost} ${data.currency}/kg</td>
                    ${firstRow ? `<td rowspan="${Object.keys(transportData).length}">${deliveryData.cost} ${deliveryData.currency}</td>` : ''}
                </tr>
            `;
            firstRow = false;
        });
    });

    tbody.innerHTML = html;
}

// Update initializeUI to include simulator
const originalInitializeUI = initializeUI;
initializeUI = function () {
    originalInitializeUI();
    initializeSimulator();
};

// Update navigateToSection to include simulator
const originalNavigateToSection = navigateToSection;
navigateToSection = function (sectionId) {
    originalNavigateToSection(sectionId);

    // Add simulator to titles
    if (sectionId === 'simulator') {
        document.getElementById('pageTitle').textContent = 'Simulateur COD';
        document.getElementById('pageSubtitle').textContent = 'Calculez votre profit réel';
        // Trigger initial calculation
        setTimeout(autoCalculate, 100);
    }

    // Add ready-for-ads to titles
    if (sectionId === 'ready-for-ads') {
        document.getElementById('pageTitle').textContent = 'Prêts à Tester';
        document.getElementById('pageSubtitle').textContent = 'Produits prêts pour le test ads';
        // Render the table
        renderReadyForAdsTable();
    }
};

// Toggle advanced parameters
function toggleAdvanced() {
    const params = document.getElementById('advancedParams');
    const arrow = document.getElementById('advancedArrow');
    if (params.style.display === 'none') {
        params.style.display = 'block';
        arrow.textContent = '▲';
    } else {
        params.style.display = 'none';
        arrow.textContent = '▼';
    }
}

// Auto calculate profit on any input change
function autoCalculate() {
    // Get form values
    const buyPrice = parseFloat(document.getElementById('simBuyPrice')?.value) || 0;
    const buyCurrency = document.getElementById('simBuyCurrency')?.value || 'USD';
    const weightGrams = parseFloat(document.getElementById('simWeight')?.value) || 0;
    const source = document.getElementById('simSource')?.value || 'Chine';
    const sellPrice = parseFloat(document.getElementById('simSellPrice')?.value) || 0;
    const sellCurrency = document.getElementById('simSellCurrency')?.value || 'CFA';
    const destination = document.getElementById('simDestination')?.value || 'CI';
    const quantity = parseInt(document.getElementById('simQuantity')?.value) || 1;
    const adCostUSD = parseFloat(document.getElementById('simAdCost')?.value) || 10;

    // Target Profit
    const targetProfit = parseFloat(document.getElementById('simTargetProfit')?.value) || 5;
    const targetCurrency = document.getElementById('simTargetCurrency')?.value || 'USD';

    // Get rates for destination
    const defaultRates = SHIPPING_DATA.exchangeRates[destination] || { MAD_to_local: 66, USD_to_local: 630, currency: 'CFA' };
    const delivery = SHIPPING_DATA.delivery[destination] || { cost: 5000, currency: 'CFA' };
    const transport = SHIPPING_DATA.transport[destination] || {};

    // Get custom rates if set, otherwise use defaults
    const rateUSD = parseFloat(document.getElementById('rateUSD')?.value) || defaultRates.USD_to_local;
    const rateMAD = parseFloat(document.getElementById('rateMAD')?.value) || defaultRates.MAD_to_local;
    const localCurrency = defaultRates.currency;

    // Update rate display labels
    const destNameEl = document.getElementById('destCountryName');
    const rateCurr1 = document.getElementById('rateCurrency1');
    const rateCurr2 = document.getElementById('rateCurrency2');
    if (destNameEl) destNameEl.textContent = COUNTRY_NAMES[destination] || destination;
    if (rateCurr1) rateCurr1.textContent = localCurrency;
    if (rateCurr2) rateCurr2.textContent = localCurrency;

    // Check if source is available
    const transportData = transport[source];
    if (!transportData && source && buyPrice > 0) {
        updateResultsDisplay(0, 0, 0, 0, 0, 0, 0, 'USD', false, source, destination, 0, 0, 'USD', 0, 'USD');
        return;
    }

    // Convert buy price to USD
    let buyPriceUSD = buyPrice;
    if (buyCurrency === 'CFA') {
        buyPriceUSD = buyPrice / rateUSD;
    } else if (buyCurrency === 'GNF') {
        buyPriceUSD = buyPrice / 10090; // Default GNF rate
    } else if (buyCurrency === 'MAD') { // Assuming MAD is Moroccan Dirham
        buyPriceUSD = buyPrice / 10.5;
    }

    // Convert sell price to USD
    let sellPriceUSD = sellPrice;
    if (sellCurrency === 'CFA') {
        sellPriceUSD = sellPrice / rateUSD;
    } else if (sellCurrency === 'GNF') {
        sellPriceUSD = sellPrice / 10090;
    } else if (sellCurrency === 'EUR') {
        sellPriceUSD = sellPrice / 0.92;
    }

    // Calculate transport cost in USD
    let transportCostUSD = 0;
    if (transportData) {
        const weightKg = weightGrams / 1000;
        if (transportData.currency === 'MAD') {
            transportCostUSD = (transportData.cost * weightKg * rateMAD) / rateUSD;
        } else if (transportData.currency === 'CFA') {
            transportCostUSD = (transportData.cost * weightKg) / rateUSD;
        } else if (transportData.currency === 'GNF') {
            transportCostUSD = (transportData.cost * weightKg) / 10090;
        }
    }

    // Calculate COD delivery cost in USD
    let deliveryCostUSD = 0;
    if (delivery.currency === 'CFA') {
        deliveryCostUSD = delivery.cost / rateUSD;
    } else if (delivery.currency === 'GNF') {
        deliveryCostUSD = delivery.cost / 10090;
    }

    // Calculate total costs per unit
    const totalUnitCostUSD = buyPriceUSD + transportCostUSD + adCostUSD + deliveryCostUSD;

    // Calculate Min Sell Price for Target Profit
    let targetProfitUSD = targetProfit;
    if (targetCurrency === 'EUR') {
        targetProfitUSD = targetProfit * 1.09; // Approx EUR to USD
    }

    const minSellPriceUSD = totalUnitCostUSD + targetProfitUSD;
    const minSellPriceLocal = minSellPriceUSD * rateUSD; // Convert to local currency (CFA/GNF)

    // Calculate actual profit
    const profitUSD = sellPriceUSD - totalUnitCostUSD;

    // For multiple quantities
    const totalProfitUSD = profitUSD * quantity;
    const totalRevenueUSD = sellPriceUSD * quantity;
    const totalBuyUSD = buyPriceUSD * quantity;
    const totalTransportUSD = transportCostUSD * quantity;
    const totalAdUSD = adCostUSD * quantity;
    const totalDeliveryUSD = deliveryCostUSD * quantity;
    const totalCostsUSD = totalUnitCostUSD * quantity;

    // Update display
    updateResultsDisplay(
        totalProfitUSD,
        totalRevenueUSD,
        totalBuyUSD,
        totalTransportUSD,
        totalAdUSD,
        totalDeliveryUSD,
        totalCostsUSD,
        'USD',
        profitUSD >= 0,
        source,
        destination,
        minSellPriceLocal,
        minSellPriceUSD,
        localCurrency,
        targetProfit,
        targetCurrency
    );
}

// Update results display
function updateResultsDisplay(profit, revenue, buy, transport, ad, delivery, totalCosts, currency, isPositive, source, destination, minSellLocal, minSellUSD, localCurrency, targetProfit, targetCurrency) {
    // Profit box
    const profitBox = document.getElementById('profitBox');
    const profitValue = document.getElementById('resultProfit');
    const profitStatus = document.getElementById('profitStatus');

    if (profitBox) {
        profitBox.classList.toggle('negative', !isPositive);
    }
    if (profitValue) {
        profitValue.textContent = `${isPositive ? '+' : ''}${profit.toFixed(2)} ${currency}`;
    }
    if (profitStatus) {
        profitStatus.textContent = isPositive ? '✓ Profit positif' : '✗ Non rentable';
    }

    // Revenue
    const revenueEl = document.getElementById('resultRevenue');
    if (revenueEl) {
        revenueEl.textContent = `${revenue.toFixed(2)} ${currency}`;
    }

    // Min Sell Price Section
    const minSellPriceEl = document.getElementById('minSellPrice');
    const minSellPriceUSDEl = document.getElementById('minSellPriceUSD');
    const targetProfitDisplay = document.getElementById('targetProfitDisplay');

    if (minSellPriceEl) {
        minSellPriceEl.textContent = `${Math.ceil(minSellLocal / 50) * 50} ${localCurrency}`; // Round up to nearest 50
    }
    if (minSellPriceUSDEl) {
        minSellPriceUSDEl.textContent = `(~$${minSellUSD.toFixed(2)} USD)`;
    }
    if (targetProfitDisplay) {
        targetProfitDisplay.textContent = `${targetProfit} ${targetCurrency}`;
    }

    // Cost breakdown
    const costBuy = document.getElementById('costBuy');
    const costTransport = document.getElementById('costTransport');
    const costAd = document.getElementById('costAd');
    const costCOD = document.getElementById('costCOD');
    const costTotal = document.getElementById('costTotal');

    if (costBuy) costBuy.textContent = `${buy.toFixed(2)} ${currency}`;
    if (costTransport) costTransport.textContent = `${transport.toFixed(2)} ${currency}`;
    if (costAd) costAd.textContent = `${ad.toFixed(2)} ${currency}`;
    if (costCOD) costCOD.textContent = `${delivery.toFixed(2)} ${currency}`;
    if (costTotal) costTotal.textContent = `${totalCosts.toFixed(2)} ${currency}`;

    // Statistics (assuming 25% delivery rate)
    const quantity = parseInt(document.getElementById('simQuantity')?.value) || 1;
    const leads = quantity * 4;
    const confirmed = quantity * 2;

    const statLeads = document.getElementById('statLeads');
    const statConfirmed = document.getElementById('statConfirmed');
    const statDelivered = document.getElementById('statDelivered');
    const statRate = document.getElementById('statRate');

    if (statLeads) statLeads.textContent = leads;
    if (statConfirmed) statConfirmed.textContent = confirmed;
    if (statDelivered) statDelivered.textContent = quantity;
    if (statRate) statRate.textContent = '25.0%';
}

// Update rates when destination changes
document.addEventListener('DOMContentLoaded', () => {
    const destSelect = document.getElementById('simDestination');
    if (destSelect) {
        destSelect.addEventListener('change', () => {
            const destination = destSelect.value;
            const rates = SHIPPING_DATA.exchangeRates[destination];
            if (rates) {
                const rateUSD = document.getElementById('rateUSD');
                const rateMAD = document.getElementById('rateMAD');
                if (rateUSD) rateUSD.value = rates.USD_to_local;
                if (rateMAD) rateMAD.value = rates.MAD_to_local;
            }
            autoCalculate();
        });
    }
});


// Function to handle URL parameters from Extension
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');

    if (action === 'add') {
        const name = urlParams.get('name');
        const image = urlParams.get('image');
        const price = urlParams.get('price');
        const weight = urlParams.get('weight');
        const link = urlParams.get('link');

        // Pre-fill form
        if (name) document.getElementById('productName').value = name;
        if (price) document.getElementById('buyPrice').value = price;
        if (weight) document.getElementById('weight').value = weight;
        if (link) document.getElementById('productLink').value = link;

        if (image) {
            document.getElementById('productImage').value = image;
            const preview = document.getElementById('imagePreview');
            if (preview) preview.innerHTML = `<img src="${image}" class="image-preview-img" alt="Product Preview">`;
        }

        const autosave = urlParams.get('autosave');
        if (autosave === 'true' && name && link) {
            // Switch to Add Product view so specific form elements are active/visible
            if (typeof navigateToSection === 'function') {
                navigateToSection('add-product');
            }

            // Wait a moment for UI to settle then save
            setTimeout(() => {
                showToast('🚀 Sauvegarde automatique...');
                // Trigger form submission
                const event = new Event('submit', { cancelable: true });
                handleProductSubmit(event);
            }, 800);
        } else {
            if (typeof navigateToSection === 'function') {
                navigateToSection('add-product');
            }
            showToast('Données importées depuis l\'extension ! 🚀');
        }

        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

// ============================================
// Ready for Ads Feature
// ============================================

let currentReadyForAdsProductId = null;

// Open Ready for Ads Modal
function openReadyForAdsModal(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    currentReadyForAdsProductId = productId;

    // Set product name in modal
    const productNameEl = document.getElementById('readyForAdsProductName');
    if (productNameEl) productNameEl.textContent = `Produit: ${product.name}`;

    // Pre-fill with existing data if available
    const campaign = product.adCampaign || {};

    // Auto-generate campaign name from product name (first 2 words)
    const autoName = product.name.split(' ').slice(0, 2).join(' ');
    document.getElementById('adCampaignName').value = campaign.campaignName || autoName;
    document.getElementById('adCountry').value = campaign.country || (product.countries && product.countries[0]) || '';
    document.getElementById('adWebsiteUrl').value = campaign.websiteUrl || '';
    document.getElementById('adImageUrl').value = campaign.imageUrl || product.image || '';
    document.getElementById('adVideoUrl').value = campaign.videoUrl || '';
    document.getElementById('adThumbnailUrl').value = campaign.thumbnailUrl || '';
    document.getElementById('adPrimaryText').value = campaign.primaryText || '';
    document.getElementById('adHeadline').value = campaign.headline || '';

    // Show modal
    const modal = document.getElementById('readyForAdsModal');
    if (modal) modal.classList.add('active');
}

// Close Ready for Ads Modal
function closeReadyForAdsModal() {
    const modal = document.getElementById('readyForAdsModal');
    if (modal) modal.classList.remove('active');
    currentReadyForAdsProductId = null;
}

// Confirm Ready for Ads
function confirmReadyForAds() {
    if (!currentReadyForAdsProductId) return;

    const product = products.find(p => p.id === currentReadyForAdsProductId);
    if (!product) return;

    // Get form values
    const campaignName = document.getElementById('adCampaignName').value.trim();
    const country = document.getElementById('adCountry').value;
    const websiteUrl = document.getElementById('adWebsiteUrl').value.trim();
    const imageUrl = document.getElementById('adImageUrl').value.trim();
    const videoUrl = document.getElementById('adVideoUrl').value.trim();
    const thumbnailUrl = document.getElementById('adThumbnailUrl').value.trim();
    const primaryText = document.getElementById('adPrimaryText').value.trim();
    const headline = document.getElementById('adHeadline').value.trim();

    // Validation
    if (!campaignName || !country || !websiteUrl) {
        showToast('❌ Campaign Name, Pays et Website URL sont obligatoires');
        return;
    }
    if (!imageUrl && !videoUrl) {
        showToast('❌ Image URL ou Video URL est obligatoire');
        return;
    }
    if (!primaryText || !headline) {
        showToast('❌ Primary Text et Headline sont obligatoires');
        return;
    }

    // Save ad campaign data
    product.adCampaign = {
        campaignName,
        country,
        websiteUrl,
        imageUrl,
        videoUrl,
        thumbnailUrl,
        primaryText,
        headline
    };
    product.readyForAds = true;

    // Update UI
    renderProductsTable();
    renderReadyForAdsTable();
    updateDashboard();
    closeReadyForAdsModal();
    showToast('🚀 Produit prêt pour test ads !');
    logActivity('Prêt pour Test', product.name);

    // Send to Cloud
    supabaseClient.from('products').update({
        readyForAds: true,
        adCampaign: product.adCampaign
    }).eq('id', currentReadyForAdsProductId)
        .then(({ error }) => {
            if (error) console.error('Ready for Ads error:', error);
        });
}

// Render Ready for Ads Table
function renderReadyForAdsTable() {
    const tbody = document.getElementById('readyForAdsBody');
    const emptyState = document.getElementById('emptyReadyForAds');
    const table = document.getElementById('readyForAdsTable');
    const countBadge = document.getElementById('readyForAdsCount');

    if (!tbody || !table) return;

    const readyProducts = products.filter(p => p.readyForAds && !p.declined);

    if (countBadge) countBadge.textContent = `${readyProducts.length} produits`;

    if (readyProducts.length === 0) {
        table.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    table.style.display = 'table';
    if (emptyState) emptyState.style.display = 'none';

    const countryNames = {
        'CI': '🇨🇮 CI', 'SN': '🇸🇳 SN', 'BF': '🇧🇫 BF', 'TG': '🇹🇬 TG',
        'NE': '🇳🇪 NE', 'ML': '🇲🇱 ML', 'BJ': '🇧🇯 BJ', 'GN': '🇬🇳 GN',
        'TD': '🇹🇩 TD', 'GA': '🇬🇦 GA'
    };

    tbody.innerHTML = readyProducts.map(p => {
        const campaign = p.adCampaign || {};
        const mediaIcon = campaign.videoUrl ? '🎬' : (campaign.imageUrl ? '🖼️' : '❓');
        const mediaUrl = campaign.videoUrl || campaign.imageUrl || '';

        return `
            <tr>
                <td>
                    ${p.image ? `<img src="${p.image}" alt="${p.name}" class="product-thumb" style="width:50px;height:50px;object-fit:cover;border-radius:8px;">` : '📦'}
                </td>
                <td>
                    <strong>${campaign.campaignName || p.name}</strong>
                    <br><small style="color:var(--text-secondary)">${p.name}</small>
                </td>
                <td>${countryNames[campaign.country] || campaign.country || '-'}</td>
                <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${campaign.primaryText || ''}">${campaign.primaryText || '-'}</td>
                <td>${campaign.headline || '-'}</td>
                <td>
                    ${mediaUrl ? `<a href="${mediaUrl}" target="_blank" title="Voir media">${mediaIcon}</a>` : '-'}
                </td>
                <td>
                    <div class="action-buttons" style="display:flex;gap:4px;">
                        <button class="btn-icon" onclick="openReadyForAdsModal('${p.id}')" title="Modifier">✏️</button>
                        <button class="btn-icon" onclick="removeFromReadyForAds('${p.id}')" title="Retirer">↩️</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Remove from Ready for Ads
function removeFromReadyForAds(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    product.readyForAds = false;
    renderProductsTable();
    renderReadyForAdsTable();
    updateDashboard();
    showToast('↩️ Produit retiré des "Prêts à Tester"');

    // Send to Cloud
    supabaseClient.from('products').update({ readyForAds: false }).eq('id', productId)
        .then(({ error }) => {
            if (error) console.error('Remove ready for ads error:', error);
        });
}

// Export to Google Sheets CSV format
function exportToGoogleSheetsCSV() {
    const readyProducts = products.filter(p => p.readyForAds && !p.declined);

    if (readyProducts.length === 0) {
        showToast('❌ Aucun produit prêt à exporter');
        return;
    }

    // CSV Headers
    const headers = [
        'Campaign Name',
        'Country',
        'Website URL',
        'Image URL',
        'Video URL',
        'Video Thumbnail URL',
        'Primary Text',
        'Headline'
    ];

    // CSV Rows
    const rows = readyProducts.map(p => {
        const c = p.adCampaign || {};
        return [
            c.campaignName || '',
            c.country || '',
            c.websiteUrl || '',
            c.imageUrl || '',
            c.videoUrl || '',
            c.thumbnailUrl || '',
            `"${(c.primaryText || '').replace(/"/g, '""')}"`,
            c.headline || ''
        ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');

    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ready_for_ads_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    showToast(`📊 ${readyProducts.length} produits exportés en CSV !`);
}

// Event Listeners for Ready for Ads Modal
document.getElementById('closeReadyForAdsModal')?.addEventListener('click', closeReadyForAdsModal);
document.getElementById('cancelReadyForAds')?.addEventListener('click', closeReadyForAdsModal);
document.getElementById('confirmReadyForAds')?.addEventListener('click', confirmReadyForAds);
document.getElementById('exportGoogleSheetsBtn')?.addEventListener('click', exportToGoogleSheetsCSV);

// Close modal on overlay click
document.getElementById('readyForAdsModal')?.querySelector('.modal-overlay')?.addEventListener('click', closeReadyForAdsModal);
