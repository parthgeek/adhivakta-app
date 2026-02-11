// ========================
// Case Type Options
// ========================
export const CASE_TYPES = [
    { value: "civil", label: "Civil" },
    { value: "criminal", label: "Criminal" },
    { value: "family", label: "Family" },
    { value: "commercial", label: "Commercial" },
    { value: "writ", label: "Writ" },
    { value: "arbitration", label: "Arbitration" },
    { value: "labour", label: "Labour" },
    { value: "revenue", label: "Revenue" },
    { value: "motor_accident", label: "Motor Accident" },
    { value: "appeal", label: "Appeal" },
    { value: "revision", label: "Revision" },
    { value: "execution", label: "Execution" },
    { value: "other", label: "Other" },
];

// ========================
// States
// ========================
export const STATES = [
    { value: "karnataka", label: "Karnataka" },
    { value: "maharashtra", label: "Maharashtra" },
    { value: "delhi", label: "Delhi" },
    { value: "tamil_nadu", label: "Tamil Nadu" },
    { value: "andhra_pradesh", label: "Andhra Pradesh" },
    { value: "kerala", label: "Kerala" },
    { value: "telangana", label: "Telangana" },
    { value: "goa", label: "Goa" },
];

// ========================
// Districts grouped by state
// ========================
export const DISTRICTS: Record<string, { value: string; label: string }[]> = {
    karnataka: [
        { value: "bengaluru_urban", label: "Bengaluru Urban" },
        { value: "bengaluru_rural", label: "Bengaluru Rural" },
        { value: "mysuru", label: "Mysuru" },
        { value: "mangaluru", label: "Mangaluru" },
        { value: "belagavi", label: "Belagavi" },
        { value: "kalaburagi", label: "Kalaburagi" },
        { value: "dharwad", label: "Dharwad" },
        { value: "tumakuru", label: "Tumakuru" },
        { value: "shivamogga", label: "Shivamogga" },
        { value: "vijayapura", label: "Vijayapura" },
        { value: "davanagere", label: "Davanagere" },
        { value: "ballari", label: "Ballari" },
        { value: "udupi", label: "Udupi" },
        { value: "raichur", label: "Raichur" },
        { value: "hassan", label: "Hassan" },
    ],
    maharashtra: [
        { value: "mumbai", label: "Mumbai" },
        { value: "pune", label: "Pune" },
        { value: "nagpur", label: "Nagpur" },
    ],
    delhi: [
        { value: "delhi", label: "Delhi" },
    ],
    tamil_nadu: [
        { value: "chennai", label: "Chennai" },
        { value: "coimbatore", label: "Coimbatore" },
        { value: "madurai", label: "Madurai" },
    ],
    andhra_pradesh: [
        { value: "visakhapatnam", label: "Visakhapatnam" },
        { value: "vijayawada", label: "Vijayawada" },
        { value: "guntur", label: "Guntur" },
    ],
    kerala: [
        { value: "thiruvananthapuram", label: "Thiruvananthapuram" },
        { value: "kochi", label: "Kochi" },
        { value: "kottayam", label: "Kottayam" },
    ],
    telangana: [
        { value: "hyderabad", label: "Hyderabad" },
        { value: "warangal", label: "Warangal" },
        { value: "nizamabad", label: "Nizamabad" },
    ],
    goa: [
        { value: "panaji", label: "Panaji" },
        { value: "margao", label: "Margao" },
        { value: "vasco", label: "Vasco" },
    ],
};

// ========================
// Court Types
// ========================
export const COURT_TYPES = [
    { value: "high_court", label: "High Court" },
    { value: "district_court", label: "District Court" },
    { value: "supreme_court", label: "Supreme Court" },
    { value: "tribunal", label: "Tribunal" },
    { value: "family_court", label: "Family Court" },
    { value: "consumer_court", label: "Consumer Court" },
    { value: "labour_court", label: "Labour Court" },
    { value: "sessions_court", label: "Sessions Court" },
    { value: "civil_court", label: "Civil Court" },
    { value: "magistrate_court", label: "Magistrate Court" },
    { value: "special_court", label: "Special Court" },
];

// ========================
// Benches (Karnataka High Court)
// ========================
export const BENCHES = [
    { value: "bengaluru", label: "Bengaluru" },
    { value: "dharwad", label: "Dharwad" },
    { value: "kalaburagi", label: "Kalaburagi" },
];

// ========================
// Priority
// ========================
export const PRIORITIES = [
    { value: "low", label: "Low" },
    { value: "normal", label: "Normal" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
];

// ========================
// Case Stages
// ========================
export const CASE_STAGES = [
    { value: "filing", label: "Filing" },
    { value: "pre_trial", label: "Pre-Trial" },
    { value: "trial", label: "Trial" },
    { value: "evidence", label: "Evidence" },
    { value: "arguments", label: "Arguments" },
    { value: "judgment", label: "Judgment" },
    { value: "execution", label: "Execution" },
    { value: "appeal", label: "Appeal" },
];

// ========================
// Party Types
// ========================
export const PARTY_TYPES = [
    { value: "Individual", label: "Individual" },
    { value: "Corporation", label: "Corporation" },
    { value: "Organization", label: "Organization" },
];

// ========================
// Petitioner Roles
// ========================
export const PETITIONER_ROLES = [
    { value: "Petitioner", label: "Petitioner" },
    { value: "Appellant", label: "Appellant" },
    { value: "Plaintiff", label: "Plaintiff" },
    { value: "Complainant", label: "Complainant" },
];

// ========================
// Respondent Roles
// ========================
export const RESPONDENT_ROLES = [
    { value: "Defendant", label: "Defendant" },
    { value: "Accused", label: "Accused" },
    { value: "Respondent", label: "Respondent" },
    { value: "Opponent", label: "Opponent" },
];

// ========================
// Statuses
// ========================
export const STATUSES = [
    { value: "active", label: "Active" },
    { value: "closed", label: "Closed" },
];

// ========================
// Lawyer Levels
// ========================
export const LAWYER_LEVELS = [
    { value: "Senior", label: "Senior" },
    { value: "Junior", label: "Junior" },
    { value: "Associate", label: "Associate" },
];

// ========================
// Chair Positions
// ========================
export const CHAIR_POSITIONS = [
    { value: "first_chair", label: "First Chair" },
    { value: "second_chair", label: "Second Chair" },
    { value: "supporting", label: "Supporting Counsel" },
];
