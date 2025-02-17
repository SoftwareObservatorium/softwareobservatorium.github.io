---
sidebar_position: 4
---

# Setting Up an Executable Corpus

## Overview

In the next step, we set up a new executable corpus consisting of two essential components:
1. **Code Search Index**: Utilizing Solr/Lucene for efficient code retrieval using LQL.
2. **Code Repository**: Leveraging Sonatype Nexus OSS to store and manage software artifacts.

## Setting Up the Code Search Index with Solr

### Why is this necessary?

The code search index is populated by LASSO, enabling interface-driven code searches that facilitate seamless collaboration among developers.

### Detailed Instructions

For a comprehensive guide on setting up Solr, please refer to our [Solr Setup Guide](../infrastructure/solr).

## Setting Up the Code Repository with Nexus

### Why is this necessary?

The code repository serves as a centralized store for executable artifacts and acts as a proxy for existing artifacts (including Maven Central by default). This setup ensures seamless integration and accessibility of software components.

### Detailed Instructions

For detailed instructions on setting up Nexus, please refer to our [Nexus Setup Guide](../infrastructure/nexus).