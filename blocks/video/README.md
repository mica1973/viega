# Video block

The video block embeds the approved Viega World YouTube video only after a visitor activates the play button. It uses YouTube's privacy-enhanced `youtube-nocookie.com` host and shows a short disclosure before playback.

## Authoring model

- One block row with a poster image in the first cell; upload it to the site's media source rather than linking a YouTube-hosted thumbnail, so the poster itself does not contact YouTube before playback.
- Put a full YouTube URL in the second cell; the link text becomes the accessible video title.
- Do not add autoplay as a block variant. Playback starts only after an explicit play-button activation.
- The block supports standard YouTube watch, youtu.be, embed, and shorts URLs; unsupported hosts are left as authored content.
