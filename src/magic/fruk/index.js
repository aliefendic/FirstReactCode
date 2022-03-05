import React from "react";

import { concat, mergeDeepWith, pipe, map, zip, mergeDeepLeft } from "ramda";

let componentRegistry = {};
Array.prototype.each = Array.prototype.map;

// TODO: optimize via memoization
// this way we will only "re-render"
// parts that are new/changed
const toJSX = (val, alreadyJsx) => {
  if (typeof val !== "object") {
    return val;
  }

  const { id, element, properties, children: children_ } = val;

  let children;
  if (element.startsWith("img")) {
    children = undefined;
  } else {
    children = children_;
  }

  if (element === "replace" && alreadyJsx[id]) {
    return alreadyJsx[id];
  }

  return React.createElement(
    componentRegistry[element] || element,
    properties,
    children && children.map((child) => toJSX(child, alreadyJsx))
  );
};

const DEBUG = false;

const log = (name) => (y) => {
  console.log(`[${name}]`, { y });
  return y;
};

const frukToTree = (DSLString) => {
  const cleanAndAppendLevels = (x) =>
    x
      .split("\n")
      .filter((x) => x && x.trim().length > 0)
      .map((x) => {
        const level = x.length - x.trimStart().length;
        return x.trimStart().startsWith("[")
          ? `>${x.trimStart()} @${level}`
          : `>${x.trimStart()}`;
      })
      .map((x) => x.replace(":class", ":className"))
      .reduce(concat);

  const findSplitInds = (arr) => [
    arr,
    arr
      .map((line, i) => {
        const isTagStart = line.startsWith("[");
        const result = isTagStart ? i : null;

        DEBUG && console.log("findSplitInds", { isTagStart, line, result });

        return result;
      })
      .filter((x) => x != null)
  ];

  const groupElements = ([arr, inds]) => {
    const zipped_ = zip(inds.slice(0, -1), inds.slice(1));

    const last = inds[inds.length - 1];
    const LEN = arr.length;
    const zipped = [...zipped_, [last, LEN + 1]];

    DEBUG && console.log("[groupElements]", { zipped, zipped_ });

    const next = zipped.map(([from, to]) => {
      return arr.slice(from, to);
    });

    DEBUG && console.log("[groupElements]", { next });

    return next;
  };

  const result = pipe(
    cleanAndAppendLevels,
    (x) => x.split(/>/),
    (x) => x.filter((x) => x.length > 0),
    findSplitInds,
    groupElements,
    map((elementParts) => {
      const [tag] = elementParts;
      const [, level_] = tag.split("@");
      const level = parseInt(level_, 10);
      let children = [];

      const jsx = elementParts
        .map((x) => {
          const [fruk] = x.split("@");
          let element = "",
            properties = {},
            id = "",
            content = "";

          if (fruk.startsWith("[")) {
            [element, id] = fruk.slice(1, -2).split("#");

            properties = mergeDeepLeft(properties, { id, key: id });
          } else if (fruk.startsWith(":")) {
            const [property, ...values] = fruk.slice(1).split(" ");
            const value = values.join(" ") + " ";

            properties = mergeDeepLeft(properties, { [property]: value });
          } else {
            children = [...(children || []), fruk];
          }

          return { element, properties, id, content };
        })
        .reduce(mergeDeepWith(concat));

      return { ...jsx, level, children };
    })
  )(DSLString);

  DEBUG && console.log({ result });

  const tree = result.map((el, i) => {
    const { level } = el;

    const [parent] = result
      .slice(0, i)
      .reverse()
      .filter((x) => x.level < level);

    return { ...el, parent };
  });

  for (let el of tree) {
    if (el.parent) {
      if (!el.parent.children) {
        el.parent.children = [];
      }
      el.parent.children.push(el);
    }
  }

  DEBUG && console.log({ tree });

  const root = tree.find((x) => !x.props && !x.parent);
  DEBUG && console.log({ root });

  return root;
};

const fruk = (params, ...values_) => {
  DEBUG && console.log({ params, values_ });

  const lenDiff = params.length - values_.length;
  const values = [...values_, Array(lenDiff).fill("").join("")];

  DEBUG && console.log({ values });

  let alreadyJsx = {};
  const zipped = zip(params, values).map(([a, b]) => {
    if (a && a.props) {
      const randomId = parseInt(Math.random() * 0xfffff, 16).toString();
      DEBUG && console.log({ randomId });
      alreadyJsx[randomId] = a;

      a = `[replace#${randomId}]`;
    }

    if (b && b.props) {
      const randomId = parseInt(Math.random() * 0xfffff, 16).toString();
      DEBUG && console.log({ randomId });
      alreadyJsx[randomId] = b;

      b = `[replace#${randomId}]`;
    }

    return a + b;
  });
  DEBUG && console.log({ zipped });

  const fullSource = zipped.join("");
  DEBUG && console.log({ fullSource });

  const root = frukToTree(fullSource);
  DEBUG && console.log({ root });

  const jsx = toJSX(root, alreadyJsx);
  DEBUG && console.log({ alreadyJsx, jsx });

  return jsx;
};

export default fruk;
