/**
* Wordfind.js 0.0.1
* (c) 2012 Bill, BunKat LLC.
* Wordfind is freely distributable under the MIT license.
* For all details and documentation:
*     http://github.com/bunkat/wordfind
*/
import {wordfind} from "./wordfind";
(function (document, $, wordfind) {

  /**
  * An example game using the puzzles created from wordfind.js. Click and drag
  * to highlight words.
  *
  * WordFindGame requires wordfind.js and jQuery.
  */

  /**
  * Initializes the WordFindGame object.
  *
  * @api private
  */
  var WordFindGame = function() {

    // List of words for this game
    var wordList;

    /**
    * Draws the puzzle by inserting rows of buttons into el.
    *
    * @param {String} el: The jQuery element to write the puzzle to
    * @param {[[String]]} puzzle: The puzzle to draw
    */
    var drawPuzzle = function (el, puzzle) {
      
      var output = '';
      // for each row in the puzzle
      for (var i = 0, height = puzzle.length; i < height; i++) {
        // append a div to represent a row in the puzzle
        var row = puzzle[i];
        output += '<div class="wordsRow">';
        // for each element in that row
        for (var j = 0, width = row.length; j < width; j++) {
            // append our button with the appropriate class
            output += '<button class="puzzleSquare" x="' + j + '" y="' + i + '">';
            output += row[j] || '&nbsp;';
            output += '</button>';
        }
        // close our div that represents a row
        output += '</div>';
      }

      $(el).html(output);
    };

    /**
    * Draws the words by inserting an unordered list into el.
    *
    * @param {String} el: The jQuery element to write the words to
    * @param {[String]} words: The words to draw
    */
    var drawWords = function (el, words) {
      let out = $("<ul></ul>");
      $(el).append(out);
      return out;
    };


    /**
    * Game play events.
    *
    * The following events handle the turns, word selection, word finding, and
    * game end.
    *
    */

    // Game state
    var startSquare, selectedSquares = [], curOrientation, curWord = '';

    /**
    * Event that handles mouse down on a new square. Initializes the game state
    * to the letter that was selected.
    *
    */
    var startTurn = function () {
      $(this).addClass('selected');
      startSquare = this;
      selectedSquares.push(this);
      curWord = $(this).text();
    };



    /**
    * Event that handles mouse over on a new square. Ensures that the new square
    * is adjacent to the previous square and the new square is along the path
    * of an actual word.
    *
    */
    var select = function (target) {
      // if the user hasn't started a word yet, just return
      if (!startSquare) {
        return;
      }

      // if the new square is actually the previous square, just return
      var lastSquare = selectedSquares[selectedSquares.length-1];
      if (lastSquare == target) {
        return;
      }

      // see if the user backed up and correct the selectedSquares state if
      // they did
      var backTo;
      for (var i = 0, len = selectedSquares.length; i < len; i++) {
        if (selectedSquares[i] == target) {
          backTo = i+1;
          break;
        }
      }

      while (backTo < selectedSquares.length) {
        $(selectedSquares[selectedSquares.length-1]).removeClass('selected');
        selectedSquares.splice(backTo,1);
        curWord = curWord.substr(0, curWord.length-1);
      }


      // see if this is just a new orientation from the first square
      // this is needed to make selecting diagonal words easier
      var newOrientation = calcOrientation(
          $(startSquare).attr('x')-0,
          $(startSquare).attr('y')-0,
          $(target).attr('x')-0,
          $(target).attr('y')-0
          );

      if (newOrientation) {
        selectedSquares = [startSquare];
        curWord = $(startSquare).text();
        if (lastSquare !== startSquare) {
          $(lastSquare).removeClass('selected');
          lastSquare = startSquare;
        }
        curOrientation = newOrientation;
      }

      // see if the move is along the same orientation as the last move
      var orientation = calcOrientation(
          $(lastSquare).attr('x')-0,
          $(lastSquare).attr('y')-0,
          $(target).attr('x')-0,
          $(target).attr('y')-0
          );

      // if the new square isn't along a valid orientation, just ignore it.
      // this makes selecting diagonal words less frustrating
      if (!orientation) {
        return;
      }

      // finally, if there was no previous orientation or this move is along
      // the same orientation as the last move then play the move
      if (!curOrientation || curOrientation === orientation) {
        curOrientation = orientation;
        playTurn(target);
      }

    };
    
    var touchMove = function(e) {
      var xPos = e.originalEvent.touches[0].pageX;
      var yPos = e.originalEvent.touches[0].pageY;
      var targetElement = document.elementFromPoint(xPos, yPos);
      select(targetElement)
    };
    
    var mouseMove = function() { 
      select(this);
    };

    /**
    * Updates the game state when the previous selection was valid.
    *
    * @param {el} square: The jQuery element that was played
    */
    var playTurn = function (square) {

      // make sure we are still forming a valid word
      for (var i = 0, len = wordList.length; i < len; i++) {
        if (wordList[i].indexOf(curWord + $(square).text()) === 0) {
          $(square).addClass('selected');
          selectedSquares.push(square);
          curWord += $(square).text();
          break;
        }
      }
    };

    /**
    * Event that handles mouse up on a square. Checks to see if a valid word
    * was created and updates the class of the letters and word if it was. Then
    * resets the game state to start a new word.
    *
    */
    var endTurn = function (e) {

      // see if we formed a valid word
      for (var i = 0, len = wordList.length; i < len; i++) {
        
        if (wordList[i] === curWord) {
          var selected = $('.selected');
            selected.addClass('found');
          wordList.splice(i,1);
          let color = e.data.colorHash.hex(curWord);
          $('.' + curWord).addClass('wordFound');
            for (let selectedIndex = 0, selectedLength = selected.length; selectedIndex < selectedLength; selectedIndex++) {
                let current = $(selected[selectedIndex]),
                    style = current.attr("style"),
                    hasBC = style != undefined && style.search("background-color") != -1;
                if(hasBC){
                    current.css("border","4px solid "+color);
                }else{
                    current.css("background-color",color);
                }
            }
          $(e.data.puzzleEl).trigger("found",curWord);
          $(e.data.wordsEl).append(`<li class="${curWord} wordFound"><i style="background-color:${color};"></i>${curWord}</li>`);
        }

        if (wordList.length === 0) {
          $('.puzzleSquare').off(".spl").addClass('complete');
          $(e.data.puzzleEl).trigger("end");
        }
      }

      // reset the turn
      $('.selected').removeClass('selected');
      startSquare = null;
      selectedSquares = [];
      curWord = '';
      curOrientation = null;
    };

    /**
    * Given two points, ensure that they are adjacent and determine what
    * orientation the second point is relative to the first
    *
    * @param {int} x1: The x coordinate of the first point
    * @param {int} y1: The y coordinate of the first point
    * @param {int} x2: The x coordinate of the second point
    * @param {int} y2: The y coordinate of the second point
    */
    var calcOrientation = function (x1, y1, x2, y2) {

      for (var orientation in wordfind.orientations) {
        var nextFn = wordfind.orientations[orientation];
        var nextPos = nextFn(x1, y1, 1);

        if (nextPos.x === x2 && nextPos.y === y2) {
          return orientation;
        }
      }

      return null;
    };

    return {

      /**
      * Creates a new word find game and draws the board and words.
      *
      * Returns the puzzle that was created.
      *
      * @param {[String]} words: The words to add to the puzzle
      * @param {String} puzzleEl: Selector to use when inserting the puzzle
      * @param {String} wordsEl: Selector to use when inserting the word list
      * @param {Options} options: WordFind options to use when creating the puzzle
      */
      create: function(words, puzzleEl, wordsEl, options,colorHash) {
        
        wordList = words.slice(0).sort();

        var puzzle = wordfind.newPuzzle(words, options);

        // draw out all of the words
        drawPuzzle(puzzleEl, puzzle);
        let list = drawWords(wordsEl, wordList);

        $('.puzzleSquare').on("mousedown.spl touchstart.spl", {puzzleEl:puzzleEl,colorHash:colorHash},startTurn)
                          .on("touchmove.spl", {puzzleEl:puzzleEl,colorHash:colorHash},touchMove)
                          .on("mouseup.spl touchend.spl", {puzzleEl:puzzleEl,wordsEl:list,colorHash:colorHash},endTurn)
                          .on("mousemove.spl",{puzzleEl:puzzleEl,colorHash:colorHash},mouseMove);

        return puzzle;
      },

      /**
      * Solves an existing puzzle.
      *
      * @param {[[String]]} puzzle: The puzzle to solve
      * @param {[String]} words: The words to solve for
      */
      solve: function(puzzle, words,list,colorHash) {

        var solution = wordfind.solve(puzzle, words).found;

        for( var i = 0, len = solution.length; i < len; i++) {
          var word = solution[i].word,
              orientation = solution[i].orientation,
              x = solution[i].x,
              y = solution[i].y,
              next = wordfind.orientations[orientation];

          if (!$('.' + word).hasClass('wordFound')) {
            let color = colorHash.hex(word);
            list.append(`<li class="${word}"><i style="background-color:${color};"></i>${word}</li>`);
            for (var j = 0, size = word.length; j < size; j++) {
              var nextPos = next(x, y, j);
              //por cada letra de la palabra
                //si no tiene bc
                    //se añade bc
                //si tiene bc
                    //se añade un elemento hijo
                    //se añade el bc
              var selected = $('[x="' + nextPos.x + '"][y="' + nextPos.y + '"]');
                for (let selectedIndex = 0, selectedLength = selected.length; selectedIndex < selectedLength; selectedIndex++) {
                    let current = $(selected[selectedIndex]),
                        childrens = current.find(".puzzleSquare"),
                        item = childrens.length == 0 ? current : childrens.last(),
                        style = item.attr("style"),
                        hasBC = style != undefined && style.indexOf("background-color") -1;
                    if(hasBC){
                        let subItem = $("<span class='puzzleSquare'>"+item.text()+"</span>")
                            .css("background-color",color);
                        item.text("");
                        item.append(subItem);
                    }else{
                        current.css("background-color",color);
                    }
                }
              selected.addClass('solved')
            }

            $('.' + word).addClass('wordFound');
          }
        }
        $('.puzzleSquare').off(".spl").trigger("end");
      }
    };
  };


  /**
  * Allow game to be used within the browser
  */
  window.wordfindgame = WordFindGame();

}(document, jQuery, wordfind));



