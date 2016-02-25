/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2016 Chalk
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * @author ChalkPE <chalkpe@gmail.com>
 * @since 2016-02-25
 */

const parser = require('./parser');
const receivers = /^\(([^()]+)\)$/;

const Sender = function(code){
    this.value = parser.parse(code);
};

const Receiver = function(code){
    var matches = code.match(receivers);
    if(!matches) throw new Error();

    this.address = (matches[1] === '#') ? '#' : parser.parse(matches[1]);
};

/**
 * @param {Sender} source
 * @param {Receiver} destination
 * @param {Boolean} [reverseOrder=false]
 * @constructor
 */
const Pipe = function(source, destination, reverseOrder){
    this.source = source;
    this.destination = destination;
    this.reverseOrder = reverseOrder || false;
};

/**
 * @param {Sender} condition
 * @constructor
 */
const LoopHead = function(condition){
    this.condition = condition;
    this.footOffset = null;
};

/**
 * @constructor
 */
const LoopFoot = function(){
    this.headOffset = null;
};

module.exports = {
    Sender:   Sender,
    Receiver: Receiver,
    Pipe:     Pipe,
    LoopHead: LoopHead,
    LoopFoot: LoopFoot
};