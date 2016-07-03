/**
 * jquery-box-game - jQuery Plugin to build a basic box puzzle game.
 * URL: http://pstrinkle.github.com/jquery-box-game
 * Author: Patrick Trinkle <https://github.com/pstrinkle>
 * Version: 1.0.0
 * Copyright 2016 Patrick Trinkle
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
(function ($) {
    "use strict";

    function BoxGame(config) {
        this.init(config);
    }

    // Returns a random integer between min (included) and max (excluded)
    // Using Math.round() will give you a non-uniform distribution!
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    BoxGame.prototype = {

        constructor: BoxGame,

        init: function(config) {
            $.extend(this, config);
        },

        debug: false,
        el: null,
        elId: '',
        cols: 25,
        rows: 25,
        cell: 20,
        colors: ['black', 'green', 'lightgreen', 'lightblue', 'blue', 'red'],
        penColor: 'black',
        blocks: {},
        onBlocks: {},
        speed: 1000,

        /**
         * offColor
         * 
         * The color for the background paintbox.
         */
        offColor: 'white',

        timeOut: null,

        dataName: 'boxgame',
        /**
         * buildIt
         * 
         * Draw the game board.
         */
        buildIt: function() {
            var el = this.el;
            var baseId = this.elId;

            /* build the paintbox. */
            el.paintbox({interactive: false,
                         offColor: this.offColor,
                         rows: this.rows,
                         cols: this.cols,
                         cell: this.cell});
        },

        /**
         * gameOver
         * 
         * The game is over, handle it.
         */
        gameOver: function() {
            clearTimeout(this.timeOut);
            this.timeOut = null;

            if (this.onGameOver) {
                this.onGameOver();
            }
        },

        /**
         * clearGameBoard
         * 
         * Clear the gameboard pieces.
         */
        clearGameBoard: function() {
            var el = this.el;
            var baseId = el.attr('id');
            var mId = '#' + baseId + 'master_box';
            var i, j;
            var offColor = this.offColor;
            var instance = this;

            this.onBlocks = {};

            for (i = 0; i < this.rows; i++) {
                this.blocks[i] = {};

                for (j = 0; j < this.cols; j++) {
                    el.paintbox('cell', {i: i, j: j, color: offColor});
                    /* XXX: add a method to paintbox to get the box. */

                    //var $cell = $(baseId + '_' + i + ',' + j);
                    //$cell.on('click', this.clickedBox);
                    this.blocks[i][j] = {color: offColor};
                }
            }

            /* Meh :( */
            $(mId + ' .box').on('click', function(event) {
                var blockId = $(this).attr('id');
                var pieces = blockId.split('_');
                var indexPair = pieces[pieces.length - 1];
                pieces = indexPair.split(',');
                var i = pieces[0];
                var j = pieces[1];

                if (instance.onBlocks[i] == undefined || 
                    instance.onBlocks[i][j] == undefined) {

                    instance.markBlock(i, j);

                    /* update the pen color. */
                    instance.randomizeColor();
                }
            }).hover(function(event) {
                /* if pen is selected, and mousedown has been activated, 
                 * then we draw, otherwise we temporarily hover.
                 */                        
                $(this).css('border', '1px solid ' + instance.penColor);
            }, function(event) {
                /* if pen is selected, and mousedown has been activated, 
                 * don't undo things.
                 */
                $(this).css('border', 'none');
            });

            return;
        },
        
        markBlock: function(i, j) {
            /* paint the box. */
            this.el.paintbox('cell', {i: i, j: j, color: this.penColor});
            this.setBlock(i, j, this.penColor);
            var foundBox = this.checkForBox(i, j);
        },
        
        /* Really stupid game player, it just tries to randomly chose a blank
         * square.  It doesn't take into account proximity to where the 
         * previous player has played, etc, which would make it more
         * intelligent.
         * 
         * Heck, at present it could give you points...
         */
        basicComputerPlay: function() {
            var rows = Object.keys(this.onBlocks);
            if (rows.length === 0) {
                return;
            }

            var indx = getRandomInt(0, rows.length);
            var i = rows[indx];
            var cols = Object.keys(this.onBlocks[i]);
            indx = getRandomInt(0, cols.length);
            var j = cols[indx];

            this.el.paintbox('cell', {i: i, j: j, color: this.offColor});
            delete this.onBlocks[i][j];
        },

        randomizeColor: function() {
            if (!this.debug) {
                this.penColor = this.colors[getRandomInt(0, this.colors.length)];
                this.el.trigger('color-change', this.penColor);    
            }
        },

        setBlock: function(i, j) {
            /* initialize row. */
            if (this.onBlocks[i] == undefined) {
                this.onBlocks[i] = {};
            }

            this.onBlocks[i][j] = {color: this.penColor};
        },

        eraseBoxes: function(boxes) {
            for (var i = 0; i < boxes.length; i++) {
                var box = boxes[i];
                if (box['vertical'] == undefined) {
                    /* horizontally based box. */
                } else {
                    /* vertically based box. */
                    var upperLeftRow = box.top.row;
                    var upperLeftCol = (box.vertical > box.outer) ? box.outer : box.vertical;
                    var lowerRightRow = box.bottom.row;
                    var lowerRightCol = (box.vertical > box.outer) ? box.vertical : box.outer;

                    /* delete all the possible turned on blocks. */
                    for (var i = upperLeftRow; i <= lowerRightRow; i++) {
                        for (var j = upperLeftCol; j <= lowerRightCol; j++) {
                            delete this.onBlocks[i][j];
                        }
                    }
                }
            }
        },
        
        /**
         * Figure out how many points are associated with that each box, and
         * wipe out each box with the offColor.
         */
        processBoxes: function(boxes) {
            /* later change it to be just a default normal box description */
            for (var b = 0; b < boxes.length; b++) {
                var box = boxes[b];
                var upperLeftRow, upperLeftCol, lowerRightRow, lowerRightCol;
                var skipPoints = 0;
                var maximumPoints;

                if (box['vertical'] == undefined) {
                    /* horizontally based box. */
                    upperLeftRow = (box.horizontal > box.outer) ? box.outer : box.horizontal;
                    upperLeftCol = box.top.col;
                    lowerRightRow = (box.horizontal > box.outer) ? box.horizontal : box.outer;
                    lowerRightCol = box.bottom.col;
                } else {
                    /* vertically based box. */
                    upperLeftRow = box.top.row;
                    upperLeftCol = (box.vertical > box.outer) ? box.outer : box.vertical;
                    lowerRightRow = box.bottom.row;
                    lowerRightCol = (box.vertical > box.outer) ? box.vertical : box.outer;
                }

                var horizontal = (lowerRightCol - upperLeftCol) - 1;
                var vertical = (lowerRightRow - upperLeftRow) - 1;
                maximumPoints = vertical * horizontal;

                /* search the inside of the box for on blocks to subtract
                 * from the points earned.
                 */
                for (var i = upperLeftRow+1; i < lowerRightRow; i++) {
                    for (var j = upperLeftCol+1; j < lowerRightCol; j++) {
                        if (this.onBlocks[i][j] != undefined) {
                            skipPoints += 1;
                        }
                    }
                }

                /* I could do something fancy like applying a CSS that
                 * makes the transition animated.
                 */
                var c = (this.debug) ? 'lightblue' : this.offColor;
                
                this.el.paintbox('rect', {i : upperLeftRow, 
                                          j: upperLeftCol, 
                                          i2: lowerRightRow,
                                          j2: lowerRightCol,
                                          color: c});

                var points = maximumPoints - skipPoints;
                this.el.trigger('points-earned', points);
            }
            
            return;
        },

        checkVertical: function(i, j) {
            /* get the color for this point, and search up and down to check
             * for a vertical line.
             */
            var c = this.onBlocks[i][j].color;
            var len = 1;
            var ni, ui;

            /* search down the rows. */
            for (ni = i; ni < this.rows; ni++) {
                /* we don't have this row. */
                if (this.onBlocks[ni] == undefined) {
                    break;
                } else {
                    /* we have this row but not this row+column. */
                    if (this.onBlocks[ni][j] == undefined) { break; }
                    if (c != this.onBlocks[ni][j].color) { break; }
                }
            }

            len += (ni-1) - i;
            
            /* search up the rows. */
            for (ui = i; ui > -1; ui--) {
                /* we don't have this row */
                if (this.onBlocks[ui] == undefined) {
                    break;
                } else {
                    /* we have this row but not this row+column. */
                    if (this.onBlocks[ui][j] == undefined) { break; }
                    if (c != this.onBlocks[ui][j].color) { break; }
                }
            }

            len += i - (ui+1);

            /* not a vertical line. */
            if (len < 3) { return []; }

            /* I considered different cycle-detection algorithsm, but since we
             * only care about specific cases of cycles -- it made since to 
             * just loop.
             */
            var boxes = [];

            var rLines = [];
            var rLowest = -1;
            var lLines = [];
            var lLowest = -1;

            ui += 1;
            for (;ui < ni; ui++) {
                var vj, llen = 1;

                /* Detect all lines that go right from the vertical. */
                for (vj = j; vj < this.cols; vj++) {
                    if (this.onBlocks[ui][vj] == undefined) { break; }
                    if (c != this.onBlocks[ui][vj].color) { break; }
                }

                /* we got here so how far did we get? */
                vj -= 1;
                llen += vj - j;
                if (llen > 2) {
                    rLines.push({row: ui, col: vj});
                    rLowest = ui;
                }

                llen = 1;

                /* Detect all lines that go left from the vertical. */                
                for (vj = j; vj > -1; vj--) {
                    if (this.onBlocks[ui][vj] == undefined) { break; }
                    if (c != this.onBlocks[ui][vj].color) { break; }
                }

                /* we got here so how far did we get? */
                vj += 1;
                llen += j - vj;
                if (llen > 2) {
                    lLines.push({row: ui, col: vj});
                    lLowest = ui;
                }
            }

            if (rLines.length + lLines.length === 0) { return []; }

            /* The last line can't intersect with anything. */
            for (var l = 0; l < (rLines.length-1); l++) {
                var line = rLines[l];
                var vj, vi;
                var ilineIndx = -1;

                /* Go to the end of this line and walk left towards the 
                 * vertical.
                 * 
                 * I had it set to vj > (j+1) but it didn't work, and I'm not
                 * sure why yet.  It should 4 > (2+1) ...
                 * XXX: address the above.
                 */
                for (vj = line.col; vj > j; vj--) {
                    /* Now go down while it's the same color and check if we
                     * intersect any of the known lower lines.
                     * 
                     * an upper line can have a vertical line intersect two
                     * boxes.
                     * 
                     * AAAAAA
                     * X    A
                     * AAAAAA
                     * A    A
                     * AAAAAA
                     * 
                     * If X is the one they clicked, we'll find the rows and 
                     * the vertical drop and when we shift to the bottom of the
                     * first box to search for the second.
                     */
                    for (vi = line.row+1; vi <= rLowest; vi++) {
                        var f = false;

                        /* this row definitely exists; so check column */
                        if (this.onBlocks[vi][vj] == undefined) { break; }
                        if (c != this.onBlocks[vi][vj].color) { break; }

                        /* skip row immediately below. */
                        if (vi == line.row+1) { continue; }
                        
                        /* so we are valid. do we intersect */
                        for (var ll = l+1; ll < rLines.length; ll++) {
                            if (rLines[ll].row == vi && rLines[ll].col >= vj) {
                                /* we intersected. */
                                ilineIndx = ll;
                                f = true;
                                break;
                            }
                        }

                        if (f) { break; }
                    }
                    
                    /* if we got here and ilineIndx != -1 then we skip out
                     * otherwise we try the next column.
                     */
                    if (ilineIndx != -1) { break; }
                } /* end for column right to left. */

                /* If we get here, then either that line intersected with 
                 * nobody or it did.
                 */
                if (ilineIndx != -1) {
                    /* ok, so we intersected. */
                    l = (ilineIndx-1); /* l++ */

                    boxes.push({'top' : line,
                                'outer' : vj,
                                'bottom' : rLines[ilineIndx],
                                'vertical' : j});
                }
            } /* for each line. */

            /* The last line can't intersect with anything. */
            for (var l = 0; l < (lLines.length-1); l++) {
                var line = lLines[l];
                var vj, vi;
                var ilineIndx = -1;

                for (vj = line.col; vj < j; vj++) {
                    for (vi = line.row+1; vi <= lLowest; vi++) {
                        var f = false;

                        /* this row definitely exists; so check column */
                        if (this.onBlocks[vi][vj] == undefined) { break; }
                        if (c != this.onBlocks[vi][vj].color) { break; }

                        /* skip row immediately below. */
                        if (vi == line.row+1) { continue;  }

                        /* so we are valid. do we intersect */
                        for (var ll = l+1; ll < lLines.length; ll++) {
                            if (lLines[ll].row == vi && lLines[ll].col >= vj) {
                                /* we intersected. */
                                ilineIndx = ll;
                                f = true;
                                break;
                            }
                        }

                        if (f) { break; }
                    }

                    if (ilineIndx != -1) { break; }
                } /* walking the columns of the line. */

                if (ilineIndx != -1) {
                    /* ok, so we intersected. */
                    l = (ilineIndx-1); /* l++ */

                    boxes.push({'top' : line,
                                'outer' : vj,
                                'bottom' : lLines[ilineIndx],
                                'vertical' : j});
                }
            } /* for each line. */

            return boxes;
        },

        checkHorizontal: function(i, j) {
            /* Get the color for this point, and search left and right to check
             * for a horizontal line.
             */
            var c = this.onBlocks[i][j].color;
            var len = 1;
            var nj, uj;

            /* search right the cols. */
            for (nj = j; nj < this.cols; nj++) {

                /* we don't have this col. */
                if (this.onBlocks[i][nj] == undefined) {
                    break;
                } else {
                    /* we have this row but not this row+column. */
                    if (this.onBlocks[i][nj] == undefined) { break; }
                    if (c != this.onBlocks[i][nj].color) { break; }
                }
            }

            len += (nj-1) - j;

            /* search left the cols. */
            for (uj = j; uj > -1; uj--) {

                /* we don't have this col*/
                if (this.onBlocks[i][uj] == undefined) {
                    break;
                } else {
                    /* we have this row but not this row+column. */
                    if (this.onBlocks[i][uj] == undefined) { break; }
                    if (c != this.onBlocks[i][uj].color) { break; }
                }
            }

            len += j - (uj+1);

            /* not a vertical line. */
            if (len < 3) { return []; }

            /* build list of above lines and below lines. */
            var boxes = [];

            var aLines = [];
            var bLines = [];
            var highestAbove = -1;
            var highestBelow = -1;

            /* Starting at far left of horizontal line, go up as far as you 
             * can.
             */
            uj += 1;
            for (;uj < nj; uj++) {
                var vi, llen = 1;

                /* Detect all lines that go below from the horizontal. */
                for (vi = i; vi < this.rows; vi++) {
                    if (this.onBlocks[vi] == undefined) { break; }
                    if (this.onBlocks[vi][uj] == undefined) { break; }
                    if (c != this.onBlocks[vi][uj].color) { break; }
                }

                vi -= 1;
                llen += vi - i;
                if (llen > 2) {
                    bLines.push({row: vi, col: uj});
                    highestBelow = uj;
                }

                llen = 1;
                for (vi = i; vi > -1; vi--) {
                    if (this.onBlocks[vi] == undefined) { break; }
                    if (this.onBlocks[vi][uj] == undefined) { break; }
                    if (c != this.onBlocks[vi][uj].color) { break; }
                }

                vi += 1;
                llen += i - vi;
                if (llen > 2) {
                    aLines.push({row: vi, col: uj});
                    highestAbove = uj;
                }
            }

            if (aLines.length + bLines.length === 0) { return []; }

            /* The last line can't intersect with anything. */
            for (var l = 0; l < (aLines.length-1); l++) {
                var line = aLines[l];
                var vi, vj;
                var ilineIndx = -1;

                /* starting at the tip of the line walk down to the line. */
                for (vi = line.row; vi < i; vi++) {
                    /* from that row, walk each column to the right looking for
                     * an intersection.
                     */
                    for (vj = line.col+1; vj <= highestAbove; vj++) {
                        var f = false;

                        if (this.onBlocks[vi][vj] == undefined) { break; }
                        if (c != this.onBlocks[vi][vj].color) { break; }

                        /* skip col immediately right. */
                        if (vj == line.col+1) { continue; }

                        /* so we are valid. do we intersect */
                        for (var ll = l+1; ll < aLines.length; ll++) {
                            if (aLines[ll].col == vj && aLines[ll].row >= vi) {
                                /* we intersected. */
                                ilineIndx = ll;
                                f = true;
                                break;
                            }
                        }

                        if (f) { break; }
                    }
                    
                    if (ilineIndx != -1) { break; }
                }

                if (ilineIndx != -1) {
                    /* ok, so we intersected. */
                    l = (ilineIndx-1); /* l++ */

                    boxes.push({'top' : line,
                                'outer' : vi,
                                'bottom' : aLines[ilineIndx],
                                'horizontal' : i});
                }
            } /* for each line. */
            
            for (var l = 0; l < (bLines.length-1); l++) {
                var line = bLines[l];
                var vi, vj;
                var ilineIndx = -1;

                /* starting at the tip of the line walk down to the line. */
                for (vi = line.row; vi > i; vi--) {
                    /* from that row, walk each column to the right looking for
                     * an intersection.
                     */
                    for (vj = line.col+1; vj <= highestBelow; vj++) {
                        var f = false;

                        if (this.onBlocks[vi][vj] == undefined) { break; }
                        if (c != this.onBlocks[vi][vj].color) { break; }

                        /* skip col immediately immediately below. */
                        if (vj == line.col+1) { continue; }

                        /* so we are valid. do we intersect */
                        for (var ll = l+1; ll < bLines.length; ll++) {
                            if (bLines[ll].col == vj && bLines[ll].row >= vi) {
                                /* we intersected. */
                                ilineIndx = ll;
                                f = true;
                                break;
                            }
                        }

                        if (f) { break; }
                    }
                    
                    if (ilineIndx != -1) { break; }
                }

                if (ilineIndx != -1) {
                    /* ok, so we intersected. */
                    l = (ilineIndx-1); /* l++ */

                    boxes.push({'top' : line,
                                'outer' : vi,
                                'bottom' : bLines[ilineIndx],
                                'horizontal' : i});
                }
            } /* for each line. */

            return boxes;
        },

        /**
         * Given the starting point, search for boxes.
         * 
         * We could be any point along a rectangle, or not.
         * 
         * We must be on a vertical or horizontal line (or at the 
         * intersection of both).
         * 
         * Once we know if we're on a horizontal or a vertical we can then
         * try tracing boxes from the largest possible to smallest.
         * 
         * You can have two boxes or four boxes being closed.  If you're on 
         * vertical you can close a box left and right, and if you're 
         * horizontal you can close a box above and below.  If you're on an 
         * intersection of a bizarrely shaped figure you can close four boxes,
         * above, below, left, and right.  But that's only for intersections.
         * 
         * We can draw some comfort in knowing though that although the boxes
         * will share an axis, that's the only overlap that can legitimately
         * happen; so if we just always check for vertical and horizontal then
         * we will handle intersection as well.
         * 
         * If we want, we could just find the largest rectangle and ignore the
         * remaining.
         */
        checkForBox: function(i, j) {
            var vboxes = null, hboxes = null, found = false;

            /* Check as vertical. */
            vboxes = this.checkVertical(i, j);
            if (vboxes.length > 0) {
                this.processBoxes(vboxes);
                found = true;
            }

            /* If vertical found four boxes it means it was an intersect point
             * and therefore at most we just closed four boxes.  So no reason
             * to process the horizontal.
             */
            if (vboxes.length < 4) {
                /* Check as horizontal. */
                hboxes = this.checkHorizontal(i, j);
                if (hboxes.length > 0) {
                    this.processBoxes(hboxes);
                    found = true;
                }

                this.eraseBoxes(hboxes);
            }

            this.eraseBoxes(vboxes);

            return found;
        },

        /**
         * resetSystem
         * 
         * Reset the system.
         */
        resetSystem: function() {
            if (this.timeOut) {
                clearTimeout(this.timeOut);
                this.timeOut = null;
            }

            this.clearGameBoard();

            this.el.trigger('color-change', this.penColor);
        },
    }

    /**
     * Set up a box game.
     * 
     * @param configOrCommand - Config object or command name
     *     Example: { ... };
     *     you may set any public property (see above);
     *
     * @param commandArgument - Some commands (like 'increment') may require an 
     *     argument
     */
    $.fn.boxGame = function(configOrCommand, commandArgument) {
        var dataName = BoxGame.prototype.dataName;

        /**
         * enableGame
         * 
         * Enable the game itself.  I haven't fully determined why this can't
         * live in the prototype.
         */
        var enableGame = function(instance) {
            /* clear the game board if from a previous game. */
            instance.resetSystem();
            
            instance.timeOut = setInterval(function() {
                instance.basicComputerPlay();
            }, instance.speed);
        };

        if (typeof configOrCommand == 'string') {
            if (configOrCommand === 'start') {
                /* you want to update this here in case they call it a lot. */
                return this.each(function() {
                    var instance = $(this).data(dataName);
                    enableGame(instance);
                });
            }
        }

        return this.each(function() {
            var el = $(this), instance = el.data(dataName),
                config = $.isPlainObject(configOrCommand) ? configOrCommand : {};

            /* XXX: Ensure that the area specified is "large enough" to play */
            if (instance) {
                instance.init(config); 
                instance.buildIt(instance);
            } else {
                var initialConfig = $.extend({}, el.data());
                config = $.extend(initialConfig, config);
                config.el = el;
                config.elId = el.attr('id');
                // throw exception if no ID is set for this.

                instance = new BoxGame(config);
                el.data(dataName, instance);

                instance.buildIt(instance);
            }
        });
    }
}(jQuery));
