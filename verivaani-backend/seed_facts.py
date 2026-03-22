import json
import logging
from google.cloud import firestore

logger = logging.getLogger(__name__)

# Facts Database
# 30 verified bilingual facts (English + Hindi)
# Categories: government schemes, health misinformation, economic data

VERIFIED_FACTS = [
    # Government Schemes
    {"id": "gov_001", "category": "government schemes", "text_en": "PM Kisan Samman Nidhi provides ₹6,000 per year to eligible farmer families.", "text_hi": "पीएम किसान सम्मान निधि पात्र किसान परिवारों को प्रति वर्ष ₹6,000 प्रदान करती है।"},
    {"id": "gov_002", "category": "government schemes", "text_en": "Ayushman Bharat provides health cover of ₹5 lakhs per family per year.", "text_hi": "आयुष्मान भारत प्रति परिवार प्रति वर्ष ₹5 लाख का स्वास्थ्य कवर प्रदान करता है।"},
    {"id": "gov_003", "category": "government schemes", "text_en": "Agnipath scheme recruits youth into the armed forces for a period of four years.", "text_hi": "अग्निपथ योजना युवाओं को चार साल की अवधि के लिए सशस्त्र बलों में भर्ती करती है।"},
    {"id": "gov_004", "category": "government schemes", "text_en": "PMJDY (Jan Dhan Yojana) ensures access to financial services with zero balance accounts.", "text_hi": "पीएमजेडीवाई (जन धन योजना) शून्य शेष खातों के साथ वित्तीय सेवाओं तक पहुंच सुनिश्चित करती है।"},
    {"id": "gov_005", "category": "government schemes", "text_en": "Mudra Yojana provides loans up to ₹10 lakh to non-corporate, non-farm small/micro enterprises.", "text_hi": "मुद्रा योजना गैर-कॉर्पोरेट, गैर-कृषि लघु/सूक्ष्म उद्यमों को ₹10 लाख तक का ऋण प्रदान करती है।"},
    {"id": "gov_006", "category": "government schemes", "text_en": "Ujjwala Yojana provides LPG connections to women from BPL households.", "text_hi": "उज्ज्वला योजना बीपीएल परिवारों की महिलाओं को एलपीजी कनेक्शन प्रदान करती है।"},
    {"id": "gov_007", "category": "government schemes", "text_en": "RBI has withdrawn ₹2000 denomination banknotes from circulation, but they continue to be legal tender.", "text_hi": "RBI ने ₹2000 मूल्यवर्ग के बैंक नोटों को चलन से वापस ले लिया है, लेकिन वे वैध मुद्रा बने हुए हैं।"},
    {"id": "gov_008", "category": "government schemes", "text_en": "Sukanya Samriddhi Yojana (SSY) is a small deposit scheme for the girl child.", "text_hi": "सुकन्या समृद्धि योजना (SSY) बालिकाओं के लिए एक छोटी जमा योजना है।"},
    {"id": "gov_009", "category": "government schemes", "text_en": "PM SVANidhi provides affordable working capital loans to street vendors.", "text_hi": "पीएम स्वनिधि स्ट्रीट वेंडर्स को किफायती कार्यशील पूंजी ऋण प्रदान करती है।"},
    {"id": "gov_010", "category": "government schemes", "text_en": "Aadhaar and PAN linking is mandatory for filing income tax returns.", "text_hi": "आयकर रिटर्न दाखिल करने के लिए आधार और पैन को लिंक करना अनिवार्य है।"},

    # Health Misinformation
    {"id": "hlt_001", "category": "health misinformation", "text_en": "Eating garlic does not cure or prevent COVID-19.", "text_hi": "लहसुन खाने से COVID-19 ठीक नहीं होता है या इससे बचाव नहीं होता है।"},
    {"id": "hlt_002", "category": "health misinformation", "text_en": "5G mobile networks do not spread viruses or COVID-19.", "text_hi": "5G मोबाइल नेटवर्क वायरस या COVID-19 नहीं फैलाते हैं।"},
    {"id": "hlt_003", "category": "health misinformation", "text_en": "Vaccines do not contain microchips or tracking devices.", "text_hi": "टीकों में माइक्रोचिप या ट्रैकिंग डिवाइस नहीं होते हैं।"},
    {"id": "hlt_004", "category": "health misinformation", "text_en": "Homeopathy is not a scientifically proven cure for diabetes.", "text_hi": "होम्योपैथी मधुमेह का वैज्ञानिक रूप से सिद्ध इलाज नहीं है।"},
    {"id": "hlt_005", "category": "health misinformation", "text_en": "Papaya leaf extract is not a definitive cure for dengue, though it may help increase platelet count.", "text_hi": "पपीते के पत्ते का अर्क डेंगू का निश्चित इलाज नहीं है, हालांकि यह प्लेटलेट काउंट बढ़ाने में मदद कर सकता है।"},
    {"id": "hlt_006", "category": "health misinformation", "text_en": "Cow urine does not cure cancer or COVID-19.", "text_hi": "गोमूत्र कैंसर या COVID-19 को ठीक नहीं करता है।"},
    {"id": "hlt_007", "category": "health misinformation", "text_en": "Drinking hot water with lemon and baking soda does not cure cancer.", "text_hi": "नींबू और बेकिंग सोडा के साथ गर्म पानी पीने से कैंसर ठीक नहीं होता है।"},
    {"id": "hlt_008", "category": "health misinformation", "text_en": "Mosquitoes cannot transmit HIV.", "text_hi": "मच्छर एचआईवी नहीं फैला सकते हैं।"},
    {"id": "hlt_009", "category": "health misinformation", "text_en": "Holding your breath for 10 seconds without coughing does not mean you are free from COVID-19.", "text_hi": "बिना खांसे 10 सेकंड तक सांस रोककर रखने का मतलब यह नहीं है कि आप COVID-19 से मुक्त हैं।"},
    {"id": "hlt_010", "category": "health misinformation", "text_en": "Drinking hot water does not kill viruses in your throat.", "text_hi": "गर्म पानी पीने से आपके गले में वायरस नहीं मरते हैं।"},

    # Economic Data
    {"id": "eco_001", "category": "economic data", "text_en": "India's GDP growth rate for FY 2023-24 was estimated at 8.2%.", "text_hi": "वित्त वर्ष 2023-24 के लिए भारत की जीडीपी वृद्धि दर 8.2% अनुमानित थी।"},
    {"id": "eco_002", "category": "economic data", "text_en": "GST slabs in India are currently 5%, 12%, 18%, and 28%.", "text_hi": "भारत में GST स्लैब वर्तमान में 5%, 12%, 18% और 28% हैं।"},
    {"id": "eco_003", "category": "economic data", "text_en": "Income up to ₹7 lakh is tax-free under the new tax regime.", "text_hi": "नई कर व्यवस्था के तहत ₹7 लाख तक की आय कर-मुक्त है।"},
    {"id": "eco_004", "category": "economic data", "text_en": "UPI transactions are generally free for consumers and merchants.", "text_hi": "UPI लेनदेन आम तौर पर उपभोक्ताओं और व्यापारियों के लिए मुफ्त हैं।"},
    {"id": "eco_005", "category": "economic data", "text_en": "The Digital Rupee (e₹) is a central bank digital currency issued by the RBI.", "text_hi": "डिजिटल रुपया (e₹) RBI द्वारा जारी एक केंद्रीय बैंक डिजिटल मुद्रा है।"},
    {"id": "eco_006", "category": "economic data", "text_en": "Indian Railways is fully owned and operated by the Government of India.", "text_hi": "भारतीय रेलवे पूरी तरह से भारत सरकार के स्वामित्व और संचालन में है।"},
    {"id": "eco_007", "category": "economic data", "text_en": "India's Forex reserves crossed $640 billion in 2024.", "text_hi": "भारत का विदेशी मुद्रा भंडार 2024 में $640 बिलियन को पार कर गया।"},
    {"id": "eco_008", "category": "economic data", "text_en": "Mudra loans are categorized into Shishu, Kishore, and Tarun.", "text_hi": "मुद्रा ऋणों को शिशु, किशोर और तरुण में वर्गीकृत किया गया है।"},
    {"id": "eco_009", "category": "economic data", "text_en": "MGNREGA guarantees 100 days of wage employment in a financial year to a rural household.", "text_hi": "मनरेगा एक वित्तीय वर्ष में एक ग्रामीण परिवार को 100 दिनों के वेतन रोजगार की गारंटी देता है।"},
    {"id": "eco_010", "category": "economic data", "text_en": "100% FDI is allowed in most sectors under the automatic route in India.", "text_hi": "भारत में स्वचालित मार्ग के तहत अधिकांश क्षेत्रों में 100% FDI की अनुमति है।"}
]

def seed_database():
    """Seeds the Firestore database with 30 verified bilingual facts."""
    logger.info("Seeding verified facts into Firestore...")
    # In a real app:
    # db = firestore.Client(project="verivani-project")
    # batch = db.batch()
    # for fact in VERIFIED_FACTS:
    #     doc_ref = db.collection('verified_facts').document(fact['id'])
    #     batch.set(doc_ref, fact)
    # batch.commit()
    logger.info(f"Seeded {len(VERIFIED_FACTS)} facts successfully. (Mock)")

if __name__ == "__main__":
    seed_database()
