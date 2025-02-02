/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

export function convertBrToParagraph(html: string) {
  const doc = new DOMParser().parseFromString(
    convertNewlinesToBr(html),
    "text/html"
  );
  for (const br of doc.querySelectorAll("br")) {
    let paragraph = br.closest("p");

    // if no paragraph is found over the br, we add one.
    if (!paragraph && br.parentElement) {
      const parent = br.parentElement;
      const p = document.createElement("p");
      p.append(...parent.childNodes);
      parent.append(p);
      paragraph = p;
    }

    if (paragraph && paragraph.childNodes.length === 1) continue;
    if (paragraph) {
      splitOn(paragraph, br);
      const children = Array.from(paragraph.childNodes.values());
      const newParagraph = doc.createElement("p");
      newParagraph.dataset.spacing = "single";
      newParagraph.append(...children.slice(children.indexOf(br) + 1));
      paragraph.insertAdjacentElement("afterend", newParagraph);
      br.remove();
    }
  }
  return doc;
}

function splitOn(bound: Element, cutElement: Element) {
  let grandparent: ParentNode | null = null;
  for (
    let parent = cutElement.parentNode;
    bound != parent;
    parent = grandparent
  ) {
    if (parent) {
      const right = parent.cloneNode(false);
      while (cutElement.nextSibling) right.appendChild(cutElement.nextSibling);
      grandparent = parent.parentNode;
      grandparent?.insertBefore(right, parent.nextSibling);
      grandparent?.insertBefore(cutElement, right);
    }
  }
}

function convertNewlinesToBr(html: string) {
  const lines = html.split(/\n/gm);
  for (let i = 0; i < lines.length; ++i) {
    if (lines[i].trim().endsWith(">")) continue;
    lines[i] += "<br>";
  }
  return lines.join("");
}
