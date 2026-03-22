import logging
import feedparser
from datetime import datetime, timezone
from google.cloud import firestore
import google.generativeai as genai

logger = logging.getLogger(__name__)

# Configure Firestore
# db = firestore.Client(project="verivani-project")

# Google News RSS fetcher — 6 feeds (English + Hindi)
RSS_FEEDS = [
    "https://news.google.com/rss/search?q=india+government+schemes&hl=en-IN&gl=IN&ceid=IN:en",
    "https://news.google.com/rss/search?q=india+health+misinformation&hl=en-IN&gl=IN&ceid=IN:en",
    "https://news.google.com/rss/search?q=india+economic+data&hl=en-IN&gl=IN&ceid=IN:en",
    "https://news.google.com/rss/search?q=भारत+सरकारी+योजनाएं&hl=hi-IN&gl=IN&ceid=IN:hi",
    "https://news.google.com/rss/search?q=भारत+स्वास्थ्य+जानकारी&hl=hi-IN&gl=IN&ceid=IN:hi",
    "https://news.google.com/rss/search?q=भारत+आर्थिक+डेटा&hl=hi-IN&gl=IN&ceid=IN:hi"
]

def fetch_rss_feeds():
    """Google News RSS fetcher — 6 feeds (English + Hindi)"""
    logger.info("Starting RSS fetch...")
    new_articles = []
    
    for feed_url in RSS_FEEDS:
        feed = feedparser.parse(feed_url)
        for entry in feed.entries[:15]: # Limit per feed
            article = {
                "id": entry.id if hasattr(entry, 'id') else entry.link,
                "title": entry.title,
                "link": entry.link,
                "published": entry.published if hasattr(entry, 'published') else datetime.now(timezone.utc).isoformat(),
                "source": entry.source.title if hasattr(entry, 'source') else "Google News",
                "processed": False
            }
            new_articles.append(article)
            
    # Firestore deduplication — skips already-fetched articles
    # In a real app:
    # batch = db.batch()
    # for article in new_articles:
    #     doc_ref = db.collection('raw_news').document(article['id'].replace('/', '_'))
    #     if not doc_ref.get().exists:
    #         batch.set(doc_ref, article)
    # batch.commit()
    
    logger.info(f"Fetched {len(new_articles)} articles. (Mock deduplication)")
    
    # Trigger Gemini claim extraction
    extract_claims_from_news()

def extract_claims_from_news():
    """Gemini claim extraction — 3-5 verifiable claims per article"""
    logger.info("Extracting claims from raw news...")
    # In a real app:
    # unprocessed = db.collection('raw_news').where('processed', '==', False).limit(10).stream()
    # for doc in unprocessed:
    #     article = doc.to_dict()
    #     # Call Gemini 2.5 Flash to extract claims
    #     # prompt = f"Extract 3-5 verifiable factual claims from this news title: {article['title']}"
    #     # response = model.generate_content(prompt)
    #     # claims = parse_response(response)
    #     
    #     # Store in live_facts collection
    #     # for claim in claims:
    #     #     db.collection('live_facts').add({"claim": claim, "source": article['link'], "timestamp": ...})
    #     
    #     # Mark article as processed
    #     # doc.reference.update({"processed": True})
    
    logger.info("Claim extraction complete. (Mock)")
