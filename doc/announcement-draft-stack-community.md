# Brouillon d'annonce — communauté STACK/Moodle

Objectif : poster ce texte (une fois traduit/finalisé) sur un canal
public et horodaté — mailing list STACK (stack-dev / stack-users),
forum moodle.org, ou lors d'une publication au plugins directory
Moodle. La date de première publication publique sert de preuve
d'antériorité sur l'idée, en complément du dépôt de marque et de
l'historique git.

**À faire avant publication :** compléter les placeholders `[...]`,
choisir le canal exact, vérifier le texte avec ton contact juridique
si besoin sur les formulations d'antériorité/paternité.

---

## Draft (English — for STACK community / moodle.org)

**Subject: Cairn for Stack — a visual PRT/question authoring layer for STACK**

Hi all,

I'd like to introduce **Cairn for Stack**, a tool I've been building to close
a gap I believe STACK has had since close to its beginning: authoring
Potential Response Trees and STACK questions has always required
writing Maxima code and hand-crafted XML directly, with no visual,
non-programmer-friendly path from idea to a working, gradable question.

Cairn for Stack is a standalone web tool that generates STACK questions
(math, physics/chemistry, computer science) through structured
generators and a visual PRT tree editor, producing valid Moodle STACK
question XML without requiring the author to write Maxima or XML by
hand.

Highlights:
- [N] question generators covering algebra, geometry, complex
  numbers, matrices, probability, chemistry, circuits, logic tables,
  etc.
- Visual PRT (Potential Response Tree) editor — build and validate the
  response tree graphically instead of editing XML.
- Accessibility: RGAA-audited (97% Lighthouse), tested with NVDA.
- Available in French and English.

Repository: [URL une fois public]
License: AGPL-3.0 (commercial licensing available on request — see
COMMERCIAL-LICENSE.md in the repo).

This has been a solo project developed alongside full-time teaching,
first started in [DATE DE DÉBUT, à préciser]. I'd welcome feedback
from the community, and I'm looking into listing it on the Moodle
plugins directory.

[Ton nom]
[Contact]

---

## Notes de calage (ne pas publier, pour toi)

- Vérifier la date réelle de début du projet (premier commit git) pour
  remplacer `[DATE DE DÉBUT]` — c'est la donnée la plus importante pour
  l'antériorité, à faire correspondre avec l'historique git rendu
  public.
- Publier ce texte **après** que le dépôt soit public et que
  LICENSE.md/COMMERCIAL-LICENSE.md soient en place — pas avant,
  sinon l'annonce précède la preuve technique d'antériorité du code.
- Envisager de publier d'abord une version courte sur un canal simple
  (ex: forum moodle.org) pour obtenir un horodatage rapide, puis la
  version longue une fois le plugins directory prêt.
