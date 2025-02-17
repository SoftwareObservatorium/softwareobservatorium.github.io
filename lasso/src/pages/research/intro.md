# Research

LASSO is an active research area.

## Publications

A list of publications related to LASSO can be found **[here](https://orcid.org/0000-0003-3088-2166)**.

### Cite our work

```bibtex
@article{kessel2025,
author = {Kessel, Marcus and Atkinson, Colin},
title = {Morescient {GAI} for Software Engineering (Extended Version)},
year = {2025},
publisher = {Association for Computing Machinery},
address = {New York, NY, USA},
issn = {1049-331X},
url = {https://doi.org/10.1145/3709354},
doi = {10.1145/3709354},
abstract = {The ability of Generative AI (GAI) technology to automatically check, synthesize and modify software engineering artifacts promises to revolutionize all aspects of software engineering. Using GAI for software engineering tasks is consequently one of the most rapidly expanding fields of software engineering research, with over a hundred LLM-based code models having been published since 2021. However, the overwhelming majority of existing code models share a major weakness – they are exclusively trained on the syntactic facet of software, significantly lowering their trustworthiness in tasks dependent on software semantics. To address this problem, a new class of “Morescient” GAI is needed that is “aware” of (i.e., trained on) both the semantic and static facets of software. This, in turn, will require a new generation of software observation platforms capable of generating large quantities of execution observations in a structured and readily analyzable way. In this paper, we present a vision and roadmap for how such “Morescient” GAI models can be engineered, evolved and disseminated according to the principles of open science.},
note = {Just Accepted},
journal = {ACM Trans. Softw. Eng. Methodol.},
month = jan,
keywords = {generative AI, morescience, semantics, dynamic, analysis, behavior-aware, observation, dataset, vision, roadmap}
}

@ARTICLE{kesselGAI2024,
  author={Kessel, Marcus and Atkinson, Colin},
  journal={IEEE Software}, 
  title={N-Version Assessment and Enhancement of Generative AI: Differential GAI}, 
  year={2025},
  volume={42},
  number={2},
  pages={76-83},
          eprint={2409.14071},
      archivePrefix={arXiv},
      url={https://arxiv.org/abs/2409.14071},
  keywords={Codes;Software;Testing;Engines;Software engineering;Generative AI;Special issues and sections;Productivity;Semantics;Costs},
  doi={10.1109/MS.2024.3469388}}

@article{kesselNextGen2023,
title = {Code search engines for the next generation},
journal = {Journal of Systems and Software Special Issue - Software Reuse for the next Generation},
pages = {112065},
year = {2024},
issn = {0164-1212},
doi = {https://doi.org/10.1016/j.jss.2024.112065},
url = {https://www.sciencedirect.com/science/article/pii/S0164121224001109},
author = {Marcus Kessel and Colin Atkinson},
keywords = {Software reuse, Code search, Big data, Big code, Behavior, Dynamic, Semantics},
abstract = {Given the abundance of software in open source repositories, code search engines are increasingly turning to “big data” technologies such as natural language processing and machine learning, to deliver more useful search results. However, like the syntax-based approaches traditionally used to analyze and compare code in the first generation of code search engines, big data technologies are essentially static analysis processes. When dynamic properties of software, such as run-time behavior (i.e., semantics) and performance, are among the search criteria, the exclusive use of static algorithms has a significant negative impact on the precision and recall of the search results as well as other key usability factors such as ranking quality. Therefore, to address these weaknesses and provide a more reliable and usable service, the next generation of code search engines needs to complement static code analysis techniques with equally large-scale, dynamic analysis techniques based on its execution and observation. In this paper we describe a new software platform specifically developed to achieve this by simplifying and largely automating the dynamic analysis (i.e., observation) of code at a large scale. We show how this platform can combine dynamically observed properties of code modules with static properties to improve the quality and usability of code search results.}
}

@article{kesselOS2023,
title = {Promoting open science in test-driven software experiments},
journal = {Journal of Systems and Software Special Issue - Open Science in Software
Engineering research},
volume = {212},
pages = {111971},
year = {2024},
issn = {0164-1212},
doi = {https://doi.org/10.1016/j.jss.2024.111971},
url = {https://www.sciencedirect.com/science/article/pii/S0164121224000141},
author = {Marcus Kessel and Colin Atkinson},
keywords = {Software, Engineering, Empirical, Experimentation, Observation, Behavior, Reproducibility, Replication, Data structures, Open science, Large language models, Machine learning, Generative artificial intelligence, Benchmark, Language-to-code, HumanEval, Automation, Measurement},
abstract = {A core principle of open science is the clear, concise and accessible publication of empirical data, including “raw” observational data as well as processed results. However, in empirical software engineering there are no established standards (de jure or de facto) for representing and “opening” observations collected in test-driven software experiments — that is, experiments involving the execution of software subjects in controlled scenarios. Execution data is therefore usually represented in ad hoc ways, often making it abstruse and difficult to access without significant manual effort. In this paper we present new data structures designed to address this problem by clearly defining, correlating and representing the stimuli and responses used to execute software subjects in test-driven experiments. To demonstrate their utility, we show how they can be used to promote the repetition, replication and reproduction of experimental evaluations of AI-based code completion tools. We also show how the proposed data structures facilitate the incremental expansion of execution data sets, and thus promote their repurposing for new experiments addressing new research questions.}
}
```

## Research Projects (Present/Past)

### Research Seed Capital (RiSC), Ministerium für Wissenschaft, Forschung und Kunst Baden Württemberg

* Title: Automated Test Oracle Recommendation – AUTOR
* Description: Harvesting test oracle information using the LASSO platform and generative artificial intelligence to recommend test oracles
* Area of Research: Software Testing (Oracle Problem)
* Duration: 2 years
* Start: September 2023