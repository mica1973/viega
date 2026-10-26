const YOUTUBE_HOSTS = new Set([
  'youtu.be',
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
]);

function getVideoId(href) {
  let url;
  try {
    url = new URL(href);
  } catch {
    return null;
  }

  if (!YOUTUBE_HOSTS.has(url.hostname)) return null;

  let videoId = url.searchParams.get('v');
  if (!videoId && url.hostname === 'youtu.be') {
    [, videoId] = url.pathname.split('/');
  }
  if (!videoId && /^\/(embed|shorts)\//.test(url.pathname)) {
    [, , videoId] = url.pathname.split('/');
  }

  return /^[A-Za-z0-9_-]{11}$/.test(videoId || '') ? videoId : null;
}

function createIframe(videoId, title) {
  const frame = document.createElement('iframe');
  const params = new URLSearchParams({ autoplay: '1', playsinline: '1', rel: '0' });
  frame.src = `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
  frame.title = title;
  frame.loading = 'lazy';
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
  frame.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share';
  frame.allowFullscreen = true;
  return frame;
}

export default function decorate(block) {
  const link = block.querySelector('a[href]');
  const picture = block.querySelector('picture');
  if (!link || !picture) return;

  const videoId = getVideoId(link.href);
  if (!videoId) return;

  const title = link.textContent.trim() || 'Viega World';
  const fallbackUrl = link.href;
  const placeholder = document.createElement('div');
  placeholder.className = 'video-placeholder';

  const poster = picture.cloneNode(true);
  poster.setAttribute('aria-hidden', 'true');
  placeholder.append(poster);

  const playButton = document.createElement('button');
  playButton.className = 'video-play-button';
  playButton.type = 'button';
  playButton.setAttribute('aria-label', `YouTube-Video abspielen: ${title}`);
  playButton.textContent = 'Video abspielen';
  placeholder.append(playButton);

  const consentNote = document.createElement('p');
  consentNote.className = 'video-consent-note';
  consentNote.textContent = 'Beim Abspielen wird eine Verbindung zu YouTube hergestellt; dabei können Daten an Google/YouTube übertragen werden.';

  const fallbackLink = document.createElement('a');
  fallbackLink.className = 'video-fallback-link';
  fallbackLink.href = fallbackUrl;
  fallbackLink.textContent = 'Video direkt auf YouTube ansehen';

  playButton.addEventListener('click', () => {
    if (block.dataset.videoLoaded === 'true') return;
    const frame = createIframe(videoId, title);
    const frameWrapper = document.createElement('div');
    frameWrapper.className = 'video-frame';
    frameWrapper.append(frame);
    block.dataset.videoLoaded = 'true';
    block.replaceChildren(frameWrapper, consentNote, fallbackLink);
  });

  block.dataset.videoLoaded = 'false';
  block.setAttribute('aria-label', `YouTube-Video: ${title}`);
  block.replaceChildren(placeholder, consentNote, fallbackLink);
}
