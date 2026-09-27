export type BouquetPhoto = {
  imageUrl: string
  sourceUrl: string
  title: string
  artist: string
  license: string
}

type CommonsImageInfo = {
  thumburl?: string
  url?: string
  descriptionurl?: string
  extmetadata?: {
    Artist?: { value?: string }
    LicenseShortName?: { value?: string }
  }
}

type CommonsSearchResponse = {
  query?: {
    pages?: Record<string, { title?: string; imageinfo?: CommonsImageInfo[] }>
  }
}

function metadataText(value?: string): string {
  return (value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

export async function findBouquetPhoto(): Promise<BouquetPhoto> {
  const query = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: 'bouquet of flowers photograph',
    gsrnamespace: '6',
    gsrlimit: '20',
    prop: 'imageinfo',
    iiprop: 'url|extmetadata',
    iiurlwidth: '1200',
    format: 'json',
  })
  const response = await fetch(`https://commons.wikimedia.org/w/api.php?${query}`, {
    headers: { 'User-Agent': 'HelloThereGreetingApp/1.0 (local learning project)' },
    signal: AbortSignal.timeout(8000),
  })

  if (!response.ok) {
    throw new Error(`Wikimedia Commons returned ${response.status}`)
  }

  const data = await response.json() as CommonsSearchResponse
  const photos = Object.values(data.query?.pages ?? {}).flatMap((page) => {
    const image = page.imageinfo?.[0]
    const imageUrl = image?.thumburl ?? image?.url

    if (!imageUrl || !image?.descriptionurl) return []

    return [{
      imageUrl,
      sourceUrl: image.descriptionurl,
      title: metadataText(page.title?.replace(/^File:/, '').replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ')),
      artist: metadataText(image.extmetadata?.Artist?.value),
      license: metadataText(image.extmetadata?.LicenseShortName?.value) || 'See source page',
    }]
  })

  if (photos.length === 0) {
    throw new Error('Wikimedia Commons returned no bouquet photos')
  }

  return photos[Math.floor(Math.random() * photos.length)]
}