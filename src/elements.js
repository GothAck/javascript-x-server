import * as x_types from "./x_types";

var x11_dom_event_map = new Map(x_types.events.prototypes.reduce((o, v) => {
  if (! v.dom_events)
    return o;
  v.dom_events.forEach((dom_event) => o.push([dom_event, v]));
  return o;
}, []));

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
      var event_source = $(event.srcElement)
        , root_offset = event_source.parents('.screen').andSelf().first().offset()
        , win_offset = event_source.offset();
      win_offset.left -= root_offset.left;
      win_offset.top  -= root_offset.top;

      return {
          x: dom_event.offsetX
        , y: dom_event.offsetY
        , root_x: dom_event.offsetX + win_offset.left
        , root_y: dom_event.offsetY + win_offset.top
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
    this.addEventListener('contextmenu', (event) => {
      event.stopPropagation();
      event.preventDefault();
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
  createdCallback() {
    this.void_events = true;
    super.createdCallback();
    this.addEventListener('mousedown', (event) => {
      this.xob.owner.buttons |= 1 << (mouse_buttons[event.button] - 1);
    }, true);
    this.addEventListener('mouseup', (event) => {
      this.xob.owner.buttons &= ~ (1 << (mouse_buttons[event.button] - 1));
    }, true);
    this.addEventListener('mousemove', (event) => {
      this.xob.owner.mouseX = event.offsetX;
      this.xob.owner.mouseY = event.offsetY;
    }, true);
    for (let [name, XEvent] of x_types.events.x11_dom_events_map) {
      if (XEvent.grab) {
        this.addEventListener(name, (event) => this.xob.owner.screenEvent(event), true);
      }
    }

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
