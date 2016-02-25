#!/usr/bin/env node

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
 * @since 2016-02-24
 */

const fs = require('fs');
const readline = require('readline');
const wrapper  = require('./lib/wrapper');
const Sender   = wrapper.Sender;
const Receiver = wrapper.Receiver;
const Pipe     = wrapper.Pipe;
const LoopHead = wrapper.LoopHead;
const LoopFoot = wrapper.LoopFoot;

const tokens = "2#+-*/<>(){}[]";
const commands = "{}[]";
const spaces = /^\s*$/;

if(process.argv.length < 3){
    console.error('No file given');
    process.exit(1);
}

var codes = [];
var codeReader = readline.createInterface({
    input: fs.createReadStream(process.argv[2])
});

const lineString = (lineNumber, columnNumber) => "[" + (lineNumber + 1) + (columnNumber? ":" + (columnNumber + 1) : '') + "]";

var lineNumber = 0;
var indent = 0;

codeReader.on('line', line => {
    var command = null;
    line.split('').forEach((token, columnNumber) => {
        if(token.match(/^\s$/)) return;

        if(tokens.indexOf(token) < 0){
            console.error(lineString(lineNumber, columnNumber), "An invalid character", token, "(Unicode: " + token.charCodeAt(0) + ")", "was found.");
            process.exit(1);
        }

        if(commands.indexOf(token) > -1){
            if(command){
                console.error(lineString(lineNumber, columnNumber), "An invalid second command", "'" + token + "'", "was found.");
                process.exit(1);
            }
            command = token;
        }
    });

    var statements = command && line.split(command).map(str => str.trim());
    switch(command){
        case null:
            if(!line.match(spaces)){
                console.error(lineString(lineNumber), "An invalid line", line, "was found. The command is required.");
                process.exit(1);
            }
            break;

        case "{":
        case "}":
            var sender, receiver;
            var r = (command === "{") ? 0 : 1;
            var s = (command === "{") ? 1 : 0;

            try{
                sender = new Sender(statements[s]);
            }catch(ex){
                console.error(lineString(lineNumber), "Invalid statement", "'" + statements[s] + "'.", "The statement", (command === "{") ? "following the '{'" : "preceding the '}'", "must be a literal or sender.");
                process.exit(1);
            }

            try{
                receiver = new Receiver(statements[r]);
            }catch(ex){
                console.error(lineString(lineNumber), "Invalid statement", "'" + statements[r] + "'.", "The statement", (command === "{") ? "preceding the '{'" : "following the '}'", "must be a receiver.");
                process.exit(1);
            }

            codes.push(new Pipe(sender, receiver, command === "{"));
            break;

        case "[":
            var loopHead;

            try{
                loopHead = new LoopHead(new Sender(statements[0]));
            }catch(ex){
                console.error(lineString(lineNumber), "Invalid statement", "'" + statements[0] + "'.", "The statement preceding the '[' must be a literal or sender.");
                process.exit(1);
            }

            if(!statements[1].match(spaces)){
                console.error(lineString(lineNumber), "Invalid statement", "'" + statements[1] + "'.", "The statement following the '[' is not allowed.");
                process.exit(1);
            }

            indent += 1;
            codes.push(loopHead);
            break;

        case "]":
            statements.forEach(statement => {
                if(!statement.match(spaces)){
                    console.error(lineString(lineNumber), "Invalid statement", "'" + statement + "'.", "The statement is not allowed in ']'.");
                    process.exit(1);
                }
            });

            if(indent === 0){
                console.error(lineString(lineNumber), "Invalid command ']'. '[' is expected for ']'.");
                process.exit(1);
            }

            indent -= 1;
            codes.push(new LoopFoot());
            break;
    }
    lineNumber++;
});

codeReader.on('close', () => {
    if(indent !== 0){
        console.error(lineString(lineNumber), "Premature end of file.", "'[' must be terminated by the matching ']'.");
        process.exit(1);
    }

    var loops = [];
    codes.forEach((code, i) => {
        if(code instanceof LoopHead) loops.push([code, i]);
        else if(code instanceof LoopFoot){
            var head = loops.pop();
            head[0].footOffset = i;
            code.headOffset = head[1];
        }
    });

    require('./lib/interpreter')(codes);
    process.stdout.write('\n');
});