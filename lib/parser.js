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

const statementFoots = '>2';

/**
 * @param {Array} tokens
 * @param {Object} [options]
 * @param {String} [initial]
 */
const parse = (tokens, options, initial) => {
    options = options || {
        indent: 0,
        lastToken: ''
    };
    options.lastToken = options.lastToken || '';

    var myIndent = options.indent;
    var statements = [initial || ''];
    var condition = token => [false, ''];

    var current;

    Loop: while(tokens.length > 0){
        var token = tokens.shift();
        var c = condition(token);

        if(c[0]) throw new Error(c[1]);
        else condition = token => [false, ''];

        switch(token){
            case '<':
                if(options.lastToken === '2') throw new Error("Missing operator");

                options.indent++;
                options.lastToken = token;

                current = statements.pop();
                if(current) statements.push(current);

                statements.push(parse(tokens, options, '<'));
                token = options.lastToken;

                statements.push('');
                break;

            case '>':
                if(options.lastToken === '<') throw new Error("Missing statement");

                options.indent--;
                statements.push(statements.pop() + token);

                if((options.indent + 1) === myIndent){
                    if(options.indent === -1) throw new Error("Missing <");

                    options.lastToken = token;
                    break Loop;
                }
                break;

            case '2':
                if(options.lastToken === '>') throw new Error("Missing operator");
                statements.push(statements.pop() + token);
                break;

            case '#':
                if(options.lastToken !== '<') throw new Error("Invalid position");

                statements.push(statements.pop() + token);
                condition = token => [token !== '>', "Must end with >"];

                break;

            case '+':
            case '-':
            case '*':
            case '/':
                if(statementFoots.indexOf(options.lastToken) < 0) throw new Error("Missing target");
                statements.push(statements.pop() + token);
        }
        options.lastToken = token;
    }

    if(myIndent === 0){
        if(options.indent > 0) throw new Error("Premature EOF");

        current = statements.pop();
        if(current) statements.push(current);
    }
    return statements;
};




/**
 * @param {String} code
 * @return {Array}
 */
exports.parse = code => parse(code.replace(/\s/g, '').split(''));