(() => {
    const searchInput = document.querySelector('#project-search');
    const searchStatus = document.querySelector('#search-status');
    const typeNav = document.querySelector('.type-nav');
    const emptyState = document.querySelector('#empty-state');
    const projectSections = Array.from(document.querySelectorAll('.project-section'));

    function filterProjects() {
      const terms = searchInput.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      let total = 0;

      projectSections.forEach(section => {
        const items = Array.from(section.querySelectorAll('.project-item'));
        let sectionTotal = 0;

        items.forEach(item => {
          const searchableText = item.textContent.toLowerCase();
          const matches = terms.every(term => searchableText.includes(term));
          item.hidden = !matches;
          if (matches) sectionTotal += 1;
        });

        section.hidden = sectionTotal === 0;
        total += sectionTotal;

        const typeLink = typeNav.querySelector(`a[href="#${section.id}"]`);
        const count = typeLink.querySelector('[data-count-for]');
        count.textContent = String(sectionTotal);
        if (sectionTotal === 0) {
          typeLink.setAttribute('aria-disabled', 'true');
        } else {
          typeLink.removeAttribute('aria-disabled');
        }
      });

      searchStatus.textContent = `${total} ${total === 1 ? 'entry' : 'entries'}`;
      typeNav.hidden = total === 0;
      emptyState.hidden = total !== 0;
    }

    searchInput.addEventListener('input', filterProjects);


filterProjects();
})();
