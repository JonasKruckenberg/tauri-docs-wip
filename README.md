[![documentation](https://img.shields.io/badge/documentation-github.io-purple.svg)](https://jonaskruckenberg.github.io/tauri-docs-wip)

# WIP

This is my work-in-progress version of the new Tauri documentation. Beware of
typos, inaccuracies, mistakes, and missing pages!

## Reasoning

There are two main reasons for this extensive rewrite, with the first being
Coherency. The current documentation has grown organically and therefore has a
number of inconsistencies: Some concepts are assumed to be self-explanatory or
are introduced _after_ they are relevant. This rewrite attempts to fix those
issues by taking readers on a "linear guided tour" first introducing important
mental concepts behind Tauri in `Background` and then stepping through the 3
relevant life-stages of an application `Development` -> `Building` ->
`Distribution`. Concepts are introduced in order if possible. The docs are
rounded off by several examples showcasing common problems and solutions.
Examples focus on "show don't tell" and contain many code examples + images
instead of explanations. It is assumed the reader knows enough about Tauri
development to understand the examples on their own.

The second big reason was style inconsistencies, different people have written
docs at different times, and it shows. Changes in narrative perspective,
different formatting, different writing styles etc. This rewrite attempts to
unify the documentation with a consistent writing and text formatting style. I
tried to not make arbitrary style choices but give reasons for them as you can
see in the style guide below:

## Style Guide

- **Use [Reference-style Links]**

  This makes reading the raw markdown and updating links easier as it doesn't
  break up the text flow as much as inline links.

- **Add Captions**

  Add captions to diagrams, images and code samples by using `<figure></figure>`
  and `<figcaption></figcaption>` if possible. This is good for accessibility
  and being able to refer to code samples. Small code snippets, like individual
  commands, that are explained through prose don't need captions, but larger
  code samples that we would refer people to should.

- **Format Code samples**

  Format code samples using [Prettier] or the [Rust Playground]. A consistent
  code formatting makes reading those samples less taxing for readers.

- **Use *You* to address readers**

  We want to keep the docs light and easy to read, so we directly address the reader.

- **Use *We* to refer to Tauri**

  We, a group of people, maintain Tauri, so we should refer to ourselves in-text as a group too.

- **Use present tense**

  This makes the text easier to comprehend. Make an exception for planned or
  obsolete features, using future or past tense as appropriate.

- **Use active voice**

  This makes the text more engaging and easier to comprehend.
  
- **Language Order**

  With code examples that are written in Rust and JavaScript, always order the code blocks `Rust > JavaScript`.

[reference-style links]:
  https://www.markdownguide.org/basic-syntax/#reference-style-links
[prettier]: https://prettier.io/playground
[rust playground]: https://play.rust-lang.org/
