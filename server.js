import express from 'express';
import cors from 'cors';
import path from 'url';
import { fileURLToPath } from 'url';
import fs from 'fs';
import pathModule from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = pathModule.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(pathModule.join(__dirname, 'public')));

const MANGADEX_API = 'https://api.mangadex.org';

// Helper to fetch from MangaDex
async function mdFetch(endpoint, params = {}) {
  const url = new URL(`${MANGADEX_API}${endpoint}`);
  Object.keys(params).forEach(key => {
    if (Array.isArray(params[key])) {
      params[key].forEach(val => url.searchParams.append(key, val));
    } else if (params[key] !== undefined && params[key] !== null) {
      url.searchParams.append(key, params[key]);
    }
  });

  console.log(`Fetching: ${url.toString()}`);
  const response = await fetch(url.toString(), {
    headers: {
      'User-Agent': 'FoxyhManga/1.0.0 (contact@mahirudex.org)'
    }
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`MangaDex error: ${response.status} - ${errText}`);
  }

  return response.json();
}

// Routes to serve pages without .html
app.get('/manga', (req, res) => {
  res.sendFile(pathModule.join(__dirname, 'public', 'manga.html'));
});

app.get('/reader', (req, res) => {
  res.sendFile(pathModule.join(__dirname, 'public', 'reader.html'));
});

app.get('/docs', (req, res) => {
  res.sendFile(pathModule.join(__dirname, 'public', 'docs.html'));
});

// 1. Search/List Manga
app.get('/api/manga', async (req, res) => {
  try {
    const { 
      title, limit = 20, offset = 0, 
      includedTags, excludedTags, status, 
      originalLanguage, publicationDemographic, 
      order = 'followedCount', contentRating 
    } = req.query;

    const params = {
      limit: parseInt(limit),
      offset: parseInt(offset),
      'includes[]': ['cover_art', 'author', 'artist'],
      'contentRating[]': contentRating ? (Array.isArray(contentRating) ? contentRating : [contentRating]) : ['safe', 'suggestive'],
    };

    if (title) params.title = title;
    
    if (status) {
      params['status[]'] = Array.isArray(status) ? status : [status];
    }
    
    if (originalLanguage) {
      params['originalLanguage[]'] = Array.isArray(originalLanguage) ? originalLanguage : [originalLanguage];
    }

    if (publicationDemographic) {
      params['publicationDemographic[]'] = Array.isArray(publicationDemographic) ? publicationDemographic : [publicationDemographic];
    }

    if (includedTags) {
      params['includedTags[]'] = Array.isArray(includedTags) ? includedTags : [includedTags];
    }
    
    if (excludedTags) {
      params['excludedTags[]'] = Array.isArray(excludedTags) ? excludedTags : [excludedTags];
    }

    if (order === 'followedCount') {
      params['order[followedCount]'] = 'desc';
    } else if (order === 'latestUploadedChapter') {
      params['order[latestUploadedChapter]'] = 'desc';
    } else if (order === 'createdAt') {
      params['order[createdAt]'] = 'desc';
    } else if (order === 'title') {
      params['order[title]'] = 'asc';
    } else if (order === 'rating') {
      params['order[rating]'] = 'desc';
    } else if (order === 'relevance') {
      params['order[relevance]'] = 'desc';
    }

    const data = await mdFetch('/manga', params);
    
    const mangaList = data.data.map(manga => {
      const coverRel = manga.relationships.find(r => r.type === 'cover_art');
      const authorRel = manga.relationships.find(r => r.type === 'author');
      const artistRel = manga.relationships.find(r => r.type === 'artist');

      const coverFileName = coverRel?.attributes?.fileName;
      const coverUrl = coverFileName 
        ? `/api/proxy?url=${encodeURIComponent(`https://uploads.mangadex.org/covers/${manga.id}/${coverFileName}`)}`
        : '/placeholder-cover.jpg';

      return {
        id: manga.id,
        title: manga.attributes.title.en || manga.attributes.title[Object.keys(manga.attributes.title)[0]] || 'Untitled',
        description: manga.attributes.description.en || manga.attributes.description[Object.keys(manga.attributes.description)[0]] || 'No description available.',
        status: manga.attributes.status,
        year: manga.attributes.year,
        tags: manga.attributes.tags.map(t => t.attributes.name.en),
        coverUrl,
        author: authorRel?.attributes?.name || 'Unknown',
        artist: artistRel?.attributes?.name || 'Unknown'
      };
    });

    res.json({
      success: true,
      data: mangaList,
      total: data.total,
      limit: data.limit,
      offset: data.offset
    });
  } catch (error) {
    console.error('Error searching manga:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Get Manga Details
app.get('/api/manga/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await mdFetch(`/manga/${id}`, {
      'includes[]': ['cover_art', 'author', 'artist']
    });

    const manga = data.data;
    const coverRel = manga.relationships.find(r => r.type === 'cover_art');
    const authorRel = manga.relationships.find(r => r.type === 'author');
    const artistRel = manga.relationships.find(r => r.type === 'artist');

    const coverFileName = coverRel?.attributes?.fileName;
    const coverUrl = coverFileName 
      ? `/api/proxy?url=${encodeURIComponent(`https://uploads.mangadex.org/covers/${manga.id}/${coverFileName}`)}`
      : '/placeholder-cover.jpg';

    const formattedManga = {
      id: manga.id,
      title: manga.attributes.title.en || manga.attributes.title[Object.keys(manga.attributes.title)[0]] || 'Untitled',
      description: manga.attributes.description.en || manga.attributes.description[Object.keys(manga.attributes.description)[0]] || 'No description available.',
      status: manga.attributes.status,
      year: manga.attributes.year,
      tags: manga.attributes.tags.map(t => t.attributes.name.en),
      coverUrl,
      author: authorRel?.attributes?.name || 'Unknown',
      artist: artistRel?.attributes?.name || 'Unknown',
      originalLanguage: manga.attributes.originalLanguage,
      publicationDemographic: manga.attributes.publicationDemographic
    };

    res.json({ success: true, data: formattedManga });
  } catch (error) {
    console.error('Error fetching manga details:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Get Related Manga list
app.get('/api/manga/:id/relation', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await mdFetch(`/manga/${id}/relation`);
    
    const relatedList = [];
    const relationMap = {};
    
    response.data.forEach(rel => {
      const relationType = rel.attributes.relation;
      const mangaRel = rel.relationships.find(r => r.type === 'manga');
      if (mangaRel) {
        relatedList.push(mangaRel.id);
        relationMap[mangaRel.id] = relationType;
      }
    });

    if (relatedList.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const mangaData = await mdFetch('/manga', {
      'ids[]': relatedList.slice(0, 15),
      'includes[]': ['cover_art'],
      limit: 15
    });

    const formattedRelations = mangaData.data.map(m => {
      const coverRel = m.relationships.find(r => r.type === 'cover_art');
      const fileName = coverRel?.attributes?.fileName;
      const coverUrl = fileName 
        ? `/api/proxy?url=${encodeURIComponent(`https://uploads.mangadex.org/covers/${m.id}/${fileName}.256.jpg`)}`
        : '/placeholder-cover.jpg';

      return {
        id: m.id,
        title: m.attributes.title.en || m.attributes.title[Object.keys(m.attributes.title)[0]] || 'Untitled',
        coverUrl,
        relationType: relationMap[m.id] || 'related'
      };
    });

    res.json({ success: true, data: formattedRelations });
  } catch (error) {
    console.error('Error fetching related manga:', error);
    res.json({ success: true, data: [] });
  }
});

// 4. Get Manga Chapters (Feed)
app.get('/api/manga/:id/feed', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 500, offset = 0, lang = 'en,id' } = req.query;

    const languages = lang.split(',');

    const params = {
      limit: parseInt(limit),
      offset: parseInt(offset),
      'translatedLanguage[]': languages,
      'order[volume]': 'asc',
      'order[chapter]': 'asc',
      'includes[]': ['scanlation_group']
    };

    const data = await mdFetch(`/manga/${id}/feed`, params);

    const chapters = data.data.map(ch => {
      const scanGroup = ch.relationships.find(r => r.type === 'scanlation_group');
      return {
        id: ch.id,
        title: ch.attributes.title || '',
        chapter: ch.attributes.chapter || '0',
        volume: ch.attributes.volume || 'N/A',
        translatedLanguage: ch.attributes.translatedLanguage,
        publishAt: ch.attributes.publishAt,
        pages: ch.attributes.pages,
        externalUrl: ch.attributes.externalUrl,
        group: scanGroup?.attributes?.name || 'No Group'
      };
    });

    chapters.sort((a, b) => {
      const numA = parseFloat(a.chapter) || 0;
      const numB = parseFloat(b.chapter) || 0;
      return numA - numB;
    });

    res.json({
      success: true,
      data: chapters,
      total: data.total,
      limit: data.limit,
      offset: data.offset
    });
  } catch (error) {
    console.error('Error fetching manga feed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Get Chapter Pages
app.get('/api/chapter/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { quality = 'data' } = req.query;

    const chapterInfo = await mdFetch(`/chapter/${id}`, {
      'includes[]': ['manga']
    });

    const mangaRel = chapterInfo.data.relationships.find(r => r.type === 'manga');
    const mangaId = mangaRel?.id;
    const externalUrl = chapterInfo.data.attributes.externalUrl;

    let pages = [];
    if (!externalUrl) {
      try {
        const serverData = await fetch(`${MANGADEX_API}/at-home/server/${id}`);
        if (serverData.ok) {
          const serverJson = await serverData.json();
          const baseUrl = serverJson.baseUrl;
          const hash = serverJson.chapter.hash;
          const pageFiles = quality === 'dataSaver' ? serverJson.chapter.dataSaver : serverJson.chapter.data;

          pages = pageFiles.map(filename => {
            const targetUrl = `${baseUrl}/${quality}/${hash}/${filename}`;
            return `/api/proxy?url=${encodeURIComponent(targetUrl)}`;
          });
        }
      } catch (err) {
        console.warn('Failed fetching MD@Home server configuration:', err);
      }
    }

    res.json({
      success: true,
      data: {
        chapterId: id,
        mangaId,
        chapter: chapterInfo.data.attributes.chapter,
        title: chapterInfo.data.attributes.title,
        externalUrl,
        pages
      }
    });
  } catch (error) {
    console.error('Error fetching chapter pages:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. Get Tag List
app.get('/api/tags', async (req, res) => {
  try {
    const data = await mdFetch('/manga/tag');
    const tags = data.data
      .filter(t => t.attributes.group === 'genre' || t.attributes.group === 'theme')
      .map(t => ({
        id: t.id,
        name: t.attributes.name.en,
        group: t.attributes.group
      }));
    res.json({ success: true, data: tags });
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7. Get Random Manga
app.get('/api/manga/random/get', async (req, res) => {
  try {
    const data = await mdFetch('/manga/random');
    res.json({ success: true, data: { id: data.data.id } });
  } catch (error) {
    console.error('Error getting random manga:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 8. Image Proxy to bypass CORS/hotlinking restrictions
app.get('/api/proxy', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).send('URL query parameter is required');
    }

    const decodedUrl = decodeURIComponent(url);
    const parsedUrl = new URL(decodedUrl);
    const hostname = parsedUrl.hostname;

    const isMangaDexDomain = hostname.endsWith('mangadex.org') || 
                             hostname.endsWith('mangadex.network') || 
                             hostname.endsWith('uploads.mangadex.org');

    if (!isMangaDexDomain) {
      return res.status(400).send('Only MangaDex or MD@Home network URLs can be proxied');
    }

    const imageResponse = await fetch(decodedUrl, {
      headers: {
        'User-Agent': 'FoxyhManga/1.0.0 (contact@mahirudex.org)',
        'Referer': 'https://mangadex.org/'
      }
    });

    if (!imageResponse.ok) {
      return res.status(imageResponse.status).send(`Failed to proxy image: ${imageResponse.statusText}`);
    }

    const contentType = imageResponse.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }
    res.setHeader('Cache-Control', 'public, max-age=86400');

    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.send(buffer);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).send('Error proxying image');
  }
});

// 9. Iframe Proxy for external manga pages (e.g. MangaPlus)
app.get('/api/iframe-proxy', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).send('URL is required');
    }

    const decodedUrl = decodeURIComponent(url);
    console.log(`Proxying iframe for: ${decodedUrl}`);

    const response = await fetch(decodedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      }
    });

    if (!response.ok) {
      return res.status(response.status).send(`Failed to load external page: ${response.statusText}`);
    }

    let html = await response.text();

    const parsedUrl = new URL(decodedUrl);
    const origin = parsedUrl.origin;
    const baseHrefTag = `<base href="${origin}/">`;
    
    html = html.replace('<head>', `<head>${baseHrefTag}`);

    html = html.replace(/window\.top\./g, 'window.');
    html = html.replace(/window\.parent\./g, 'window.');
    html = html.replace(/top\.location/g, 'self.location');

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Frame-Options', 'ALLOWALL');
    res.setHeader('Content-Security-Policy', "frame-ancestors *; default-src * 'unsafe-inline' 'unsafe-eval';");

    res.send(html);
  } catch (error) {
    console.error('Iframe proxy error:', error);
    res.status(500).send('Error proxying external page');
  }
});

// Unmatched route handler (404)
app.use((req, res) => {
  res.status(404).send('Not Found');
});

app.listen(PORT, () => {
  console.log(`============================================`);
  console.log(`FoxyhManga backend running at:`);
  console.log(`http://localhost:${PORT}`);
  console.log(`============================================`);
});
