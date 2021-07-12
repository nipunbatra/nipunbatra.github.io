---
layout: page
<<<<<<< HEAD
title: projects
permalink: /projects/
description: A growing collection of your cool projects.
nav: true
---

<div class="projects grid">

  {% assign sorted_projects = site.projects | sort: "importance" %}
  {% for project in sorted_projects %}
  <div class="grid-item">
    {% if project.redirect %}
    <a href="{{ project.redirect }}" target="_blank">
    {% else %}
    <a href="{{ project.url | relative_url }}">
    {% endif %}
      <div class="card hoverable">
        {% if project.img %}
        <img src="{{ project.img | relative_url }}" alt="project thumbnail">
        {% endif %}
        <div class="card-body">
          <h2 class="card-title text-lowercase">{{ project.title }}</h2>
          <p class="card-text">{{ project.description }}</p>
          <div class="row ml-1 mr-1 p-0">
            {% if project.github %}
            <div class="github-icon">
              <div class="icon" data-toggle="tooltip" title="Code Repository">
                <a href="{{ project.github }}" target="_blank"><i class="fab fa-github gh-icon"></i></a>
              </div>
              {% if project.github_stars %}
              <span class="stars" data-toggle="tooltip" title="GitHub Stars">
                <i class="fas fa-star"></i>
                <span id="{{ project.github_stars }}-stars"></span>
              </span>
              {% endif %}
            </div>
            {% endif %}
          </div>
        </div>
      </div>
    </a>
  </div>
{% endfor %}

</div>
=======
title: Openings
permalink: /openings/
description: Openings in our lab
---

**NEW: I am currently not looking for students. The below will be useful once this notice has been removed**



I am looking to work with motivated students! Care about ML/AI/sensors/Python/open source? Want to contribute your bit for a sustainable environment (reducing energy, pollution, etc.)?

I would ideally like you to read through at least one paper from each category below and prepare a summary. This is also or you to understand if your interests match with mine, to guage the fit.

* * *

#### Category A (Data Science)

*   Transferring Decomposed Tensors for Scalable Energy Breakdown across Regions\[[PDF](../papers/batra_aaai_2018.pdf)\]\[[Github](https://github.com/nipunbatra/transferable-energy-breakdown)\]
*   Matrix Factorisation for Scalable Energy Breakdown\[[PDF](../papers/batra_aaai2017.pdf)\]\[[Github](https://github.com/nipunbatra/mf-energybreakdown)\]\[[Poster](../slides/aaai_poster_2017.pdf)\]
*   Gemello: Creating a Detailed Energy Breakdown from just the Monthly Electricity Bill\[[PDF](https://dl.acm.org/authorize?N39733)\]\[[Github](https://github.com/nipunbatra/Gemello)\]\[[Poster](../slides/kdd_poster_final.pdf)\]\[[Video](https://www.youtube.com/watch?v=pzgqd9OhvDA)\]

#### Category B (Sensors, Systems and Deployment)

*   If You Measure It, Can You Improve It? Exploring The Value of Energy Disaggregation.\[[PDF](../papers/batra_buildsys_15.pdf)\]\[[Github](https://github.com/nipunbatra/nilm-actionable)\]\[[Slides (.key)](../slides/batra_buildsys_2015_slides final.key)\]\[[Slides (.pdf)](../slides/batra_buildsys_2015_slides final.pdf)\]
*   NILMTK: An Open Source Toolkit for Non-intrusive Load Monitoring\[[PDF](../papers/batra_nilmtk.pdf)\]\[[Slides (.pptx)](../slides/nilmtk_presentation.pptx)\]\[[Slides (.pdf)](../slides/nilmtk_presentation.pdf)\]
*   It’s Different: Insights into home energy consumption in India\[[PDF](../papers/buildsys_2013.pdf)\]\[[Github](https://github.com/nipunbatra/Home_Deployment)\]\[[Dataset](http://iawe.github.io/)\]\[[Slides (.pptx)](../slides/buildsys_13_slides.pptx)\]\[[Slides (.pdf)](../slides/buildsys_13_slides.pdf)\]

* * *

I would also like you to go through the [research method bootcamp material](https://github.com/nipunbatra/CS-Research-Methods-Bootcamp
    ). After having done so, I want you to write an abstract for any new line of research that you would like to do under me.

* * *

**After having gone thorugh the above and having prepared your response, please fill the [following survey form](https://goo.gl/forms/UxFCSJlNZLdqjF0V2) and then write me an email that you have submitted the form**

* * *

Please note that I will not be able to offer positions unless you **commit working at least an year with me**, the only exception being summer internships.

* * *

* * *

### Outside students for internships

For students outside IITGN applying for summer internships, please look at SRIP at IIT Gandhinagar. Please also complete the survey form mentioned above.

### Prospective PhD students

In addition to the above survey form, I would request you to formally apply via IIT GN PhD admission portal. Please also see [CSE specific guidelines here](http://cs.iitgn.ac.in/admissions/).

### Prospective Research Assistants

If your goal is to do higher studies abroad or a PhD from India, and you want to strengthen your profile, please write to me after filling the above survey form. I would like to clear upfront that a good publication can often take more than an year of work.

### For IITGN students

After filling the above mentioned survey form, please drop me an email to meet me in person.

* * *
>>>>>>> 9b2a489 (added all)
