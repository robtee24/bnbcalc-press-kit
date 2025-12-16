import ogs from 'open-graph-scraper';

export interface OGData {
  title: string;
  ogImage: string | null;
  description: string | null;
}

export async function extractOGData(url: string): Promise<OGData> {
  try {
    const { result } = await ogs({ url });
    
    return {
      title: result.ogTitle || result.twitterTitle || result.dcTitle || 'Untitled',
      ogImage: result.ogImage?.[0]?.url || result.twitterImage?.[0]?.url || null,
      description: result.ogDescription || result.twitterDescription || result.dcDescription || null,
    };
  } catch (error) {
    console.error('Error extracting OG data:', error);
    return {
      title: 'Untitled',
      ogImage: null,
      description: null,
    };
  }
}

