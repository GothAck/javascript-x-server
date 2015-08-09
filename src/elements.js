import * as x_types from "./x_types";

var x11_dom_event_map = new Map((
  for (p of x_types.events.map.values())
    if (p.dom_event)
      [p.dom_event, p]));

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
    shadow.appendChild(
      document.importNode(
        document.getElementById('x-drawable-style').content, true));
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

var mouse_buttons = [1,3,2];
var events = [
  'blur',
  'focus',
  'focusin',
  'focusout',
  'load',
  'resize',
  'scroll',
  'unload',
  'click',
  'dblclick',
  'mousedown',
  'mouseup',
  'mousemove',
  'mouseover',
  'mouseout',
  'mouseenter',
  'mouseleave',
  'change',
  'select',
  'submit',
  'keydown',
  'keypress',
  'keyup',
  'error'
];

export class XWindowElement extends XDrawableElement {
  getCustomEventData(dom_event) {
      var server = this.xob.owner.server;
      var keybutmask = (
              (server && server.buttons || 0) |
//              (
//                  dom_event.type === 'mousedown' &&
//                  (1 << (mouse_buttons[dom_event.button] - 1))
//              )
              0
          ) << 8;
      if (dom_event.type === 'mousedown' || dom_event.type === 'mouseup') {
        keybutmask |= 0x10;
        keybutmask &= ~((1 << (mouse_buttons[dom_event.button] - 1)) << 8); 
      }
      // keybutmask |= dom_event.shiftKey && 1;
      // lock? = 2
      // keybutmask |= dom_event.ctrlKey  && 4;

      return {
          x: dom_event.offsetX
        , y: dom_event.offsetY
        , root_x: dom_event.offsetX
        , root_y: dom_event.offsetY
        , button: mouse_buttons[dom_event.button]
        , keycode: dom_event.keyCode
        , keybutmask: keybutmask
      };
  }
  browserEventCallback(event) {
    var X11Event = x_types.events.dom_event_to_x11_map.get(event.type);
    if (X11Event) {
      var src = this;
      var window = this.xob;
      if (event.type === 'mouseover') {
        this.classList.add('hover');
      }
      if (event.type === 'mouseout') {
        this.classList.remove('hover');
      }
      var x11_event = new X11Event(window, this.getCustomEventData(event))
      window.triggerEvent(x11_event);
      event.stopPropagation();
    }
  }
  createdCallback() {
    super.createdCallback();
    if (!this.void_events) {
      for (let event of events) {
        this.addEventListener(event, (e) => this.browserEventCallback(e));
      }
      this.addEventListener('SendMask', (e) => {
        var xob = this.xob;
        var event_mask = e.detail.event_mask;
        var x_event = e.detail.event;
        if ((xob.event_mask && event_mask) || ! event_mask) {
          x_event.event_window = xob;
          xob.onEvent('SendEvent', x_event);
          e.stopPropagation();
        }
      });
    }
    this.style.display = 'none';
    this.addEventListener('contextmenu', (e) => {
      e.stopPropagation();
      e.preventDefault();
    });
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
    var elem = this
    while (elem = elem.previousSibling) {
      yield elem;
    }
  }
  *genNextSiblings() {
    var elem = this
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
  hasNextSibling(...siblings) {
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
  createdCallback() {
    this.void_events = true;
    super.createdCallback();
    this.addEventListener('mousedown', (e) => {
      this.xob.owner.buttons |= 1 << (mouse_buttons[e.button] - 1);
    }, true);
    this.addEventListener('mouseup', (e) => {
      this.xob.owner.buttons &= ~ (1 << (mouse_buttons[e.button] - 1));
    }, true);
    this.addEventListener('mousemove', (e) => {
      this.xob.owner.mouseX = e.offsetX;
      this.xob.owner.mouseY = e.offsetY;
    }, true);
    for (let [name, XEvent] of x_types.events.x11_events_map) {
      if (XEvent.grab) {
        this.addEventListener(
          name,
          (event) => this.xob.owner.screenEvent(event, true),
          true);
        // this.addEventListener(
        //   name,
        //   (event) => this.xob.owner.screenEvent(event));
      }
    }
    this.setAttribute('mapped', true);

  }
}

export function register() {
  document.registerElement(
    'x-drawable', {prototype: XDrawableElement.prototype});
  document.registerElement(
    'x-window', {prototype: XWindowElement.prototype});
  document.registerElement(
    'x-screen', {prototype: XScreenElement.prototype});
}
