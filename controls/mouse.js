
'use strict';

/**
 * @license
 * Copyright Little Star Media Inc. and other contributors.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the
 * 'Software'), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to permit
 * persons to whom the Software is furnished to do so, subject to the
 * following conditions:
 *
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
 * NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
 * USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/**
 * The mouse controls module.
 *
 * @module axis/controls/mouse
 * @type {Function}
 */

void module.exports;

/**
 * Module dependencies.
 * @private
 */

var inherits = require('inherits')

/**
 * Local dependencies.
 * @private
 */

var AxisController = require('./controller')
  , constants = require('../constants')
  , util = require('../util')

// default mouse friction value
var DEFAULT_MOUSE_MOVEMENT_FRICTION = constants.DEFAULT_MOUSE_MOVEMENT_FRICTION;

/**
 * Initializes mouse controls on Axis.
 *
 * @public
 * @param {Axis} axis - The Axis instance.
 * @return {MouseController}
 */

module.exports = function mouse (axis) {
  return MouseController(axis)
  .target(axis.camera)
  .enable();
};

/**
 * MouseController constructor
 *
 * @public
 * @constructor
 * @class MouseController
 * @extends AxisController
 * @see {@link module:axis/controls/controller~AxisController}
 * @param {Axis} scope - The axis instance
 */

module.exports.MouseController = MouseController;
inherits(MouseController, AxisController);
function MouseController (scope) {
  if (!(this instanceof MouseController)) {
    return new MouseController(scope);
  }

  // inherit from `AxisController'
  AxisController.call(this, scope);

  /**
   * Mouse controller movements.
   *
   * @public
   * @name state.movements
   * @type {Object}
   */

  this.state.movements = {

    /**
     * X movement coordinate value.
     *
     * @public
     * @name state.movement.x
     * @type {Number}
     */

    x: 0,

    /**
     * Y movement coordinate value.
     *
     * @public
     * @name state.movement.y
     * @type {Number}
     */

    y: 0
  };

  /**
   * Initial mouse controller movement.
   *
   * @public
   * @name state.movementsStart
   * @type {Object}
   */

  this.state.movementsStart = {

    /**
     * X movement start value.
     *
     * @public
     * @name state.movementsStart.x
     * @type {Object}
     */

    x: 0,

    /**
     * Y movement start value.
     *
     * @public
     * @name state.movementsStart.y
     * @type {Object}
     */

    y: 0
  };

  /**
   * Is mousedown predicate.
   *
   * @public
   * @name state.isMousedown
   * @type {Boolean}
   */

  this.state.isMousedown = false;

  /**
   * Mouseup timeout ID
   *
   * @public
   * @name state.mouseupTimeout
   * @type {Number}
   */

  this.state.mouseupTimeout = 0;

  // initialize event delegation.
  this.events.bind('mouseleave');
  this.events.bind('mousedown');
  this.events.bind('mousemove');
  this.events.bind('mouseup');
}

/**
 * Handles 'onmousedown' events.
 *
 * @private
 * @name onmousedown
 * @param {Event} e - Event object.
 */

MouseController.prototype.onmousedown = function (e) {
  var friction = this.scope.state.mouseFriction || DEFAULT_MOUSE_MOVEMENT_FRICTION;
  clearTimeout(this.state.mouseupTimeout);
  this.state.forceUpdate = false;
  this.state.isMousedown = true;
  this.state.movementsStart.x = e.screenX * friction;
  this.state.movementsStart.y = e.screenY * friction;
};

/**
 * Handles 'onmouseup' events.
 *
 * @private
 * @name onmouseup
 * @param {Event} e - Event object.
 */

MouseController.prototype.onmouseup = function (e) {
  this.state.forceUpdate = true;
  this.state.isMousedown = false;
  clearTimeout(this.state.mouseupTimeout);
  this.state.mouseupTimeout = setTimeout(function () {
    this.state.forceUpdate = false;
    this.state.movementsStart.x = 0;
    this.state.movementsStart.y = 0;
  }.bind(this), this.scope.state.controllerUpdateTimeout);
};

/**
 * Handles 'onmousemove' events.
 *
 * @private
 * @name onmousemove
 * @param {Event} e - Event object.
 */

MouseController.prototype.onmousemove = function (e) {
  var movements = this.state.movements;
  var friction = this.scope.state.mouseFriction || DEFAULT_MOUSE_MOVEMENT_FRICTION;
  var tmp = 0;

  // handle mouse movements only if the mouse controller is enabled
  if (false == this.state.isEnabled || false == this.state.isMousedown) {
    return;
  }

  movements.x = (e.screenX * friction) - this.state.movementsStart.x;
  movements.y = (e.screenY * friction) - this.state.movementsStart.y;

  // normalized movements from event
  util.normalizeMovements(e, movements);

  // apply friction
  movements.y *= friction/2;
  movements.x *= friction;

  // swap for rotation
  tmp = movements.y;
  movements.y = movements.x;
  movements.x = tmp;

  this.rotate(movements);
  this.state.movementsStart.x = e.screenX * friction;
  this.state.movementsStart.y = e.screenY * friction;
};

/**
 * Handles 'onmousemove' events.
 *
 * @private
 * @name onmousemove
 * @param {Event} e - Event object.
 */

MouseController.prototype.onmouseleave = function () {
  this.onmouseup();
};

/**
 * Resets mouse controller state.
 *
 * @public
 * @method
 * @name reset
 * @return {MouseController}
 */

MouseController.prototype.reset = function () {
  clearTimeout(this.state.mouseupTimeout);
  AxisController.prototype.reset.call(this);
  this.state.isMousedown = false;
  this.state.mouseupTimeout = 0;
  this.state.movementsStart.x = 0;
  this.state.movementsStart.y = 0;
  this.state.movements.x = 0;
  this.state.movements.y = 0;
  return this;
};

/**
 * Implements AxisController#update() method.
 *
 * @public
 * @method
 * @name update
 * @return {MouseController}
 */

MouseController.prototype.update = function () {
  if (false == this.state.isMousedown) { return this; }
  AxisController.prototype.update.call(this);
  return this;
};
