(() => {
    const searchInput = document.querySelector('#video-search');
    const searchStatus = document.querySelector('#search-status');
    const emptyState = document.querySelector('#empty-state');
    const sections = Array.from(document.querySelectorAll('.video-section'));
    const noun = searchInput.dataset.noun;
    const nouns = searchInput.dataset.nouns;

    function filterVideos() {
      const terms = searchInput.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      let shown = 0;
      let total = 0;
      sections.forEach(section => {
        let count = 0;
        section.querySelectorAll('.lesson-video').forEach(card => {
          const match = terms.every(term => card.textContent.toLowerCase().includes(term));
          card.hidden = !match;
          total += 1;
          if (match) count += 1;
        });
        section.hidden = count === 0;
        shown += count;
        const chip = document.querySelector(`[data-count-for="${section.id}"]`);
        if (chip) {
          chip.textContent = String(count);
          const link = chip.closest('a');
          if (count === 0) link.setAttribute('aria-disabled', 'true'); else link.removeAttribute('aria-disabled');
        }
      });
      searchStatus.textContent = terms.length ? `${shown} of ${total} ${nouns}` : `${total} ${total === 1 ? noun : nouns}`;
      emptyState.hidden = shown !== 0;
    }

    searchInput.addEventListener('input', filterVideos);

filterVideos();
})();
