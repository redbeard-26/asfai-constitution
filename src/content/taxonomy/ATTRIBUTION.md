# Taxonomy data attribution

The files in this directory — `topics.json` (1,590 micro-topics) and `dependencies.json`
(3,221 prerequisite edges) — are derived from the **Marble Open Skill Taxonomy**:

- Source: https://github.com/withmarbleapp/os-taxonomy
- Author: Marble (withmarbleapp)

## Licensing

The upstream project is multi-licensed, and these obligations carry over to the copies bundled here:

- **Database rights** (the structure/selection of topics and dependency edges):
  [Open Database License (ODbL) v1.0](https://opendatacommons.org/licenses/odbl/1-0/).
- **Authored content** (topic names, descriptions, evidence criteria, assessment prompts):
  [Creative Commons Attribution-ShareAlike 4.0 (CC BY-SA 4.0)](https://creativecommons.org/licenses/by-sa/4.0/).
- Upstream curriculum standards referenced in the `standards` fields (NGSS, Common Core,
  UK National Curriculum) remain under their own respective licenses.

Both ODbL and CC BY-SA are **share-alike**: this attribution and the license terms must be
preserved wherever the taxonomy data is redistributed. This obligation applies to the data in
this directory, not to the application source code that consumes it.

The files are used unmodified as read reference data by `src/lib/taxonomy.ts`.
