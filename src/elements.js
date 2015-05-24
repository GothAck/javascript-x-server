function _HTMLDivElement() {}
_HTMLDivElement.prototype = HTMLDivElement.prototype;

export class XDrawableElement extends _HTMLDivElement {
  createElement(name, props, style) {
    var elem = document.createElement(name);
    if (props) {
      for (let k in props) {
        elem[k] = props[k];
      }
    }
    if (style) {
      for (let k in style) {
        elem.style[k] = style[k];
      }
    }
    return elem;
  }
  createdCallback() {
    var shadow = this.createShadowRoot();
    this.canvas = this.createElement('canvas');
    shadow.appendChild(this.canvas);
  }
  attributeChangedCallback(name, oldVal, newVal) {
    switch (name) {
      case 'width':
        this.canvas.width = newVal;
        this.style.width = newVal + 'px';
        break;
      case 'height':
        this.canvas.height = newVal;
        this.style.height = newVal + 'px';
        break;
    }
  }
}

export class XWindowElement extends XDrawableElement {
  createdCallback() {
    super.createdCallback();
    var shadow = this.createShadowRoot();
    var relative = this.createElement('div', {className: 'relative'})
    this.container = this.createElement('div', {className: 'container'});

    shadow.appendChild(
      document.importNode(
        document.getElementById('x-window-style').content, true));

    shadow.appendChild(this.container);
    this.container.appendChild(relative);
    relative.appendChild(this.createElement('shadow'));
    relative.appendChild(this.createElement('content'));
  }
  attributeChangedCallback(name, oldVal, newVal) {
    super.attributeChangedCallback(name, oldVal, newVal);
    switch (name) {
      case 'width':
        this.container.style.width = newVal + 'px';
        break;
      case 'height':
        this.container.style.height = newVal + 'px';
        break;
      case 'mapped':
        if (newVal) {
          this.style.display = 'block';
        } else {
          this.style.display = 'none';
        }
    }
  }
  collidesWith(...elems) {
    var res = [];
    for (let elem of elems) {
      if (elem.tagName !== this.tagName) {
        throw new Error('x-window.collidesWith must take another x-window elem');
      }
      var t_br = this.getBoundingClientRect();
      var e_br = elem.getBoundingClientRect();
      if (
        (t_br.left > e_br.right || e_br.left > t_br.right) ||
        (t_br.top < e_br.bottom || e_br.top < t_br.bottom)
      ) {
        continue;
      }
      res.push(elem);
    }
    if (res.length) {
      return res;
    }
    return false;
  }
  *genPreviousSiblings() {
    elem = this
    while (elem = elem.previousSibling) {
      yield elem;
    }
  }
  *genNextSiblings() {
    elem = this
    while (elem = elem.nextSibling) {
      yield elem;
    }
  }
  *genSiblings() {
    yield* this.genNextSiblings();
    yield* this.genPreviousSiblings();
  }
  hasPrevSibling(...siblings) {
    for (let elem of this.genPreviousSiblings()) {
      if (siblings.includes(elem)) {
        return true;
      }
    }
    return false;
  }
  hasNextSibling(...sibling) {
    for (let elem of this.genNextSiblings()) {
      if (siblings.includes(elem)) {
        return true;
      }
    }
    return false;
  }
  prependChild(elem) {
    if (this.childNodes.length) {
      this.insertBefore(elem, this.childNodes[0]);
    } else {
      this.appendChild(elem);
    }
  }
  insertAfter(elem, after) {
    if (after.nextSibling) {
      this.insertBefore(elem, after.nextSibling);
    } else {
      this.appendChild(elem);
    }
  }
}

export class XScreenElement extends XWindowElement {

}

export function register() {
  document.registerElement(
    'x-drawable', {prototype: XDrawableElement.prototype});
  document.registerElement(
    'x-window', {prototype: XWindowElement.prototype});
  document.registerElement(
    'x-screen', {prototype: XScreenElement.prototype});
}
