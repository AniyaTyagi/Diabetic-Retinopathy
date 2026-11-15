export type Language = "en" | "hi";

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    "nav.dashboard": "Dashboard",
    "nav.patients": "Patients",
    "nav.newScreening": "New Screening",
    "nav.screenings": "Screenings",
    "nav.reports": "Reports",
    "nav.analytics": "Analytics",
    "nav.review": "Doctor Review",
    "nav.settings": "Settings",
    "nav.notifications": "Notifications",

    // Header & Status
    "status.online": "Online",
    "status.offline": "Offline",
    "header.search": "Search patient ID or name",
    "header.center": "PHC Kothapally",

    // DR Severity
    "dr.level0": "No DR",
    "dr.level1": "Mild NPDR",
    "dr.level2": "Moderate NPDR",
    "dr.level3": "Severe NPDR",
    "dr.level4": "Proliferative DR",

    // Clinical & Screening
    "screening.quality": "Image Quality",
    "screening.suitable": "Suitable for analysis",
    "screening.unsuitable": "Recapture recommended",
    "screening.confidence": "Model Confidence",
    "screening.referralNeeded": "Ophthalmologist review recommended",
    "screening.noReferral": "Routine follow-up; no urgent referral",
    "screening.reviewStatus": "Clinical Review Status",
    "screening.unreviewed": "UNREVIEWED - AI output only",
    "screening.verified": "Verified by clinician",
    "screening.submitReview": "Submit Clinical Review",
    "screening.downloadReport": "Download PDF Report",
    "screening.retake": "Recapture Image",
    "screening.consent": "Informed Consent Obtained",
    "screening.disclaimer": "AI-assisted screening decision support only. Final diagnosis must be confirmed by an ophthalmologist.",

    // Patient & Demographics
    "patient.info": "Patient Information",
    "patient.id": "Patient ID",
    "patient.name": "Full Name",
    "patient.age": "Age",
    "patient.gender": "Gender",
    "patient.mobile": "Mobile Number",
    "patient.center": "Screening Center",
    "patient.diabetesType": "Diabetes Type",
    "patient.duration": "Diabetes Duration (years)",
    "patient.notes": "Clinical Notes",

    // Actions & Workflow
    "action.save": "Save",
    "action.continue": "Continue to Image Upload",
    "action.scheduleFollowUp": "Schedule Follow-up",
    "action.printPdf": "Print & Export PDF",
    "action.share": "Share Securely",

    // Referral Priorities
    "referral.urgent": "Urgent Priority",
    "referral.routine": "Routine Priority",
    "referral.standard": "Standard Care",
  },
  hi: {
    // Navigation
    "nav.dashboard": "डैशबोर्ड",
    "nav.patients": "मरीज़ सूची",
    "nav.newScreening": "नई स्क्रीनिंग",
    "nav.screenings": "स्क्रीनिंग रिकॉर्ड",
    "nav.reports": "रिपोर्ट्स",
    "nav.analytics": "विश्लेषण",
    "nav.review": "डॉक्टर समीक्षा",
    "nav.settings": "सेटिंग्स",
    "nav.notifications": "सूचनाएं",

    // Header & Status
    "status.online": "ऑनलाइन",
    "status.offline": "ऑफ़लाइन",
    "header.search": "मरीज़ आईडी या नाम खोजें",
    "header.center": "प्राथमिक स्वास्थ्य केंद्र (PHC)",

    // DR Severity
    "dr.level0": "कोई रेटिनोपैथी नहीं (स्तर 0)",
    "dr.level1": "हल्की गैर-प्रोलिफेरेटिव (स्तर 1)",
    "dr.level2": "मध्यम गैर-प्रोलिफेरेटिव (स्तर 2)",
    "dr.level3": "गंभीर गैर-प्रोलिफेरेटिव (स्तर 3)",
    "dr.level4": "प्रोलिफेरेटिव रेटिनोपैथी (स्तर 4)",

    // Clinical & Screening
    "screening.quality": "छवि गुणवत्ता",
    "screening.suitable": "विश्लेषण के लिए उपयुक्त",
    "screening.unsuitable": "पुनः फोटो खींचने की सलाह",
    "screening.confidence": "मॉडल सटीकता/विश्वास",
    "screening.referralNeeded": "नेत्र विशेषज्ञ परामर्श आवश्यक",
    "screening.noReferral": "नियमित जांच; तत्काल रेफरल नहीं",
    "screening.reviewStatus": "चिकित्सकीय समीक्षा स्थिति",
    "screening.unreviewed": "अपुष्ट - केवल AI परिणाम",
    "screening.verified": "चिकित्सक द्वारा सत्यापित",
    "screening.submitReview": "समीक्षा दर्ज करें",
    "screening.downloadReport": "PDF रिपोर्ट डाउनलोड करें",
    "screening.retake": "पुनः फोटो लें",
    "screening.consent": "मरीज़ की सहमति प्राप्त",
    "screening.disclaimer": "यह केवल AI-आधारित चिकित्सकीय सहायता है। अंतिम निर्णय नेत्र रोग विशेषज्ञ द्वारा ही लिया जाना चाहिए।",

    // Patient & Demographics
    "patient.info": "मरीज़ की जानकारी",
    "patient.id": "मरीज़ आईडी",
    "patient.name": "पूरा नाम",
    "patient.age": "उम्र",
    "patient.gender": "लिंग",
    "patient.mobile": "मोबाइल नंबर",
    "patient.center": "स्क्रीनिंग केंद्र",
    "patient.diabetesType": "मधुमेह का प्रकार",
    "patient.duration": "मधुमेह की अवधि (वर्ष)",
    "patient.notes": "चिकित्सीय विवरण",

    // Actions & Workflow
    "action.save": "सुरक्षित करें",
    "action.continue": "फोटो अपलोड पर आगे बढ़ें",
    "action.scheduleFollowUp": "फॉलो-अप तय करें",
    "action.printPdf": "प्रिंट व PDF डाउनलोड",
    "action.share": "सुरक्षित साझा करें",

    // Referral Priorities
    "referral.urgent": "तत्काल प्राथमिकता",
    "referral.routine": "सामान्य प्राथमिकता",
    "referral.standard": "नियमित देखभाल",
  },
};
