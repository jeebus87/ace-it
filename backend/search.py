"""
DuckDuckGo search service with reliability filtering.
"""

from ddgs import DDGS

# Reliable source domains (educational, government, reputable)
RELIABLE_DOMAINS = [
    ".edu", ".gov", ".org",
    "wikipedia.org", "britannica.com", "khanacademy.org",
    "nature.com", "sciencedirect.com", "ncbi.nlm.nih.gov",
    "smithsonianmag.com", "nationalgeographic.com",
    "bbc.com", "bbc.co.uk", "npr.org", "pbs.org",
    "nytimes.com", "washingtonpost.com", "theguardian.com",
    "reuters.com", "apnews.com",
    "harvard.edu", "mit.edu", "stanford.edu", "yale.edu",
    "coursera.org", "edx.org", "academia.edu",
    "scholar.google.com", "researchgate.net",
    "history.com", "scientificamerican.com",
]


def is_reliable_source(url: str) -> bool:
    """Check if a URL is from a reliable source."""
    url_lower = url.lower()
    return any(domain in url_lower for domain in RELIABLE_DOMAINS)


def perform_search(query: str, min_results: int = 5, max_results: int = 10) -> dict:
    """
    Search DuckDuckGo and return results with reliability filtering.

    Args:
        query: Search query string
        min_results: Minimum number of results to return
        max_results: Maximum results to fetch from DuckDuckGo

    Returns:
        Dict with results list, each containing title, url, snippet, is_reliable
    """
    results = []

    try:
        with DDGS() as ddgs:
            search_results = ddgs.text(query, max_results=max_results)

            for item in search_results:
                url = item.get("href", "")
                results.append({
                    "title": item.get("title", ""),
                    "url": url,
                    "snippet": item.get("body", ""),
                    "is_reliable": is_reliable_source(url)
                })

        # Sort: reliable sources first, preserving original order within groups
        indexed = [(i, r) for i, r in enumerate(results)]
        indexed.sort(key=lambda x: (not x[1]["is_reliable"], x[0]))
        sorted_results = [r for _, r in indexed]

        # Ensure at least min_results
        reliable_count = sum(1 for r in sorted_results if r["is_reliable"])
        final_count = max(min_results, reliable_count)

        return {
            "results": sorted_results[:final_count],
            "total": len(sorted_results),
            "reliable_count": reliable_count
        }

    except Exception as e:
        return {
            "results": [],
            "error": str(e),
            "total": 0,
            "reliable_count": 0
        }
