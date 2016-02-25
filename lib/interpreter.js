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

const wrapper  = require('./wrapper');
const Pipe     = wrapper.Pipe;
const LoopHead = wrapper.LoopHead;
const LoopFoot = wrapper.LoopFoot;

const chalk = require('chalk');
const readlineOptions = {
    caseSensitive: true,
    keepWhitespace: true,
    hideEchoBack: true, mask: ''
};


const flatten = array => {
    var flatMap = [];
    array.forEach(item => {
        if(Array.isArray(item)) flatMap = flatMap.concat(flatten(item));
        else flatMap.push(item);
    });

    return flatMap;
};

const execute = (memory, read, array) => eval(flatten(array).join('').replace(/<#>/g, "read()").replace(/</g, "memory[").replace(/>/g, "]"));

/**
 * @param {Object[]} codes
 */
module.exports = codes => {
    const readlineSync = require('readline-sync');
    const write = value => process.stdout.write(String.fromCharCode(value));
    const read = () => {
        var key = readlineSync.keyIn('', readlineOptions);
        process.stdout.write(chalk.yellow(key));
        return key.charCodeAt(0);
    };

    var memory = Array.apply(null, new Array(256)).map(i => 0);
    var pointer = 0;

    while(pointer < codes.length){
        var code = codes[pointer++];

        if(code instanceof Pipe){
            var sourceValue = pipe => execute(memory, read, pipe.source.value);
            var destinationAddress = pipe => execute(memory, read, pipe.destination.address);

            if(code.destination.address === '#') write(sourceValue(code));
            else if(code.reverseOrder){
                var address = destinationAddress(code);
                memory[address] = sourceValue(code);
            }else{
                var value = sourceValue(code); void(value);
                memory[destinationAddress(code)] = value;
            }
        }
        else if(code instanceof LoopHead && execute(memory, read, code.condition.value) !== 0) pointer = code.footOffset + 1;
        else if(code instanceof LoopFoot) pointer = code.headOffset;
    }
    return memory;
};