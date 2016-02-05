"use strict";

/* global window, console, document, module, vmrLite, $eid, alert */

var app={
    _id : '123456',
    version : '0.7 [2015-12-02]',
    author : 'Murray Speight'
};

function Ball(config) {
    if (!(this instanceof Ball)) { // If invoked as a factory by mistake
        console.debug('Ball not called with new');
        return new Ball();
    }
    this.was='';
    this.runs='';
    this.out='';
    this.batterCode = '';
    this.nonStrikerCode = '';

    this.markup = '';

    this.nBalls = 0;
    this.nBFaced = 0;
    this.nRuns = 0;
    this.n4s = 0;
    this.n6s = 0;

    this.nNoball = 0;
    this.nWides = 0;

    this.nBye = 0;
    this.nLbye = 0;
    this.nWickets = 0;
    this.nCross = 0;

    this.playersCrossed='';
    this.dismissal=''; // blank or 'w' (for Wicket)
    this.dismissalBy='';
    this.dismissalFielderId='';

    if ( config )
        for (var k in config)
          this[k] = config[k];

    this.recalc();
}


Ball.dismissalMap = {
    'c' : "Caught", // + By fielder + Crossed
    'b' : "Bowled", //
    '+' : "Caught+Bowled", // + Crossed
    'r' : "Run out", // + By fielder
    'R' : "Run out (Non)", // NON Striker + By fielder
    'l' : "LBW", //
    's' : "Stumped", //
    'u' : "Retired", //
    'U' : "Retired (Non)", // NON Striker
    'k' : "Hit wicket", // Batter Hit The Wicket)
    'h' : "Handled the ball", //
    't' : "Hit the ball twice", //
    'o' : "Obstructing the field", //
    'x' : "Timed out"
};

Ball.dismissalKeys = Object.keys(Ball.dismissalMap);


Ball.prototype.toString = function() {
    // OPTIONS:
    // WIDE + Runs
    // xx   + Runs
    // NO-BALL + Runs = o...
    // NO-BALL + Runs of Bat = o2
    // . = No-Runs = &bull;
    // O = No-Ball = O (and extras not runs)
    // O = No-Ball/Hit = O (and extras not runs)
    // X = Wide = +
    // b = Bye = &bigtriangleup;
    // g = Leg Bye = &bigtriangledown;

    return  this.was + this.runs + this.dismissal;
};


Ball.prototype.recalc = function() {

    var i;
    this.markup = '&nbsp;';

    this.nBalls = 0;
    this.nBFaced = 0;
    this.nRuns = 0;
    this.n4s = 0;
    this.n6s = 0;

    this.nNoball = 0;
    this.nWides = 0;

    this.nBye = 0;
    this.nLbye = 0;
    this.nWickets = 0;

    if (( this.runs ) && ( !this.was ))
        this.was = '-'; // # Runs and no action, default to a Runs
    if ( !this.was || !this.runs ) {
        return null; // Nothing their
    }

    if ( !this.dismissal ) {
        this.dismissalBy='';
        this.dismissalFielderId='';
    } else {
        // A Dismissal
        this.nWickets=1;
        if ( this.dismissalBy == 'u'  || this.dismissalBy == 'U' ) { // Retired
            this.nWickets=0; // Retired is NOT a wicket !!
        }
        if (!(this.dismissalBy=='c'||this.dismissalBy=='r'||this.dismissalBy=='R')) // NOT Caught/Run-out
            this.dismissalFielderId=''; // FielderId is N/a
    }

    var runsInt = parseInt(this.runs,10);

    if ( this.was == 'b' ) { // Bye (triangle)
        this.nBalls=1;
        this.nBFaced=1;
        this.nBye = runsInt;
        this.markup = '&bigtriangleup;'; // Triange for 1st run.
        if ( this.nBye > 1 ) {
            this.markup += '<sup>'; // Plus x Dots for 2nd+ runs
            for (i=1;i<runsInt;i++)
              this.markup += '&bull;';
            this.markup += '</sup>';
        }
    } else if ( this.was == 'l' ) { // Leg-Bye (down-triangle)
        this.nBalls=1;
        this.nBFaced=1;
        this.nLbye = runsInt;
        this.markup = '&bigtriangledown;'; // down-triangle for 1st run
        if ( this.nLbye > 1 ) {
            this.markup += '<sup>'; // Plus x Dots for 2nd+ runs
            for (i=1;i<runsInt;i++)
              this.markup += '&bull;';
            this.markup += '</sup>';
        }
    } else if ( this.was == 'w' ) { // Wide
        this.nBalls=1;
        this.nBFaced = 0; // Wides don't count as balls faced to a batter
        this.nWides = 1;
        this.markup = '+'; // Plus
        if ( runsInt > 0 ) {
            this.nWides = 1 + runsInt;
            this.markup += '<sup>';
            for (i=0;i<runsInt;i++) // Plus x Dots for any runs made
              this.markup += '&bull;';
            this.markup += '</sup>';
        }
    } else if ( this.was == 'n' ) { // No Ball
        this.nBalls=1;
        this.nBFaced=1; // No balls count as balls faced
        this.nNoball = 1;
        this.markup = 'O'; // &cir;  &CircleDot;
        if ( runsInt > 0 ) {
            this.nNoball = 1 + runsInt; // Dont add to bye (as not fault of wicket-keeper)
            this.markup += '<sup>';
            for (i=0;i<runsInt;i++) // Plus x Dots for any runs made
              this.markup += '&bull;';
            this.markup += '</sup>';
        }
    } else if ( this.was == 'N' ) { // No Ball (with runs off the Bat)
        this.nBalls=1;
        this.nBFaced=1; // No balls count as balls faced
        this.nNoball = 1;
        this.markup = 'O'; // &#x2460; Circle1
        if ( runsInt > 0 ) {
            this.nRuns = runsInt; // Plus a number for any runs of the bat
            this.markup += '<sup>' + String(runsInt) + '</sup>';
        }
    } else if ( this.runs ) {
        // Normal
        this.nBalls=1;
        this.nBFaced=1;
        this.nRuns = runsInt;
        if ( this.nRuns === 0 ) {
            this.markup = '&bull;';
        } else  {
            this.markup = String(this.nRuns);
            if ( this.nRuns == 4 ) this.n4s = 1;
            if ( this.nRuns == 6 ) this.n6s = 1;
        }
    } else {
       this.markup = '&nbsp;';
    }
    if ( this.dismissal == 'w' ) {
        if ( this.dismissalBy == 'u'  || this.dismissalBy == 'U' ) {
            // Retired
            this.markup += '<sup>r</sup>';
        } else if ( this.dismissalBy == 'R' ) {
            // Dismissal of Non-Striker "R" (run-out)
            // We should be able to work this out. from runs ? (No could be either end)
            this.markup += '<sup>R</sup>';
        } else {
            // Striker out.
            if ( this.markup == '&bull;' ) // No runs
                this.markup = 'W';
            else
                this.markup += '<sup>W</sup>';
        }
    }
    this.nCross = this.nRuns + this.nBye + this.nLbye;
    if ( this.nNoball > 0  )
      this.nCross += ( this.nNoball - 1);
    if ( this.nWides > 0  )
      this.nCross += ( this.nWides - 1);
    if ( this.playersCrossed == 'x' ) {
        this.markup += '<sup>x</sup>';
        this.nCross += 1;
    }

    return this;
};



Ball.prototype.isBlank = function() {
    this.recalc();
    return ( !this.was || !this.runs );
};

Ball.prototype.getName = function() {
    if ( this.code === 0 ) return 'Next Ball';
    return 'Ball #' + String(this.code);
};


Ball.prototype.getBallLabel = function() {
    switch ( this.was ) {
        case 'b': return '# Byes';
        case 'l': return '# Lbyes';
        case 'w': return 'Wd+Byes';
        case 'n': return 'Nb+Byes';
        case 'N': return 'Nb+Runs';
    }
    return '# Runs';
};

Ball.prototype.getMarkup = function() {
    return this.markup;
};

Ball.prototype.ZZZ_setBatterBasedOnLastBall = function(lastBall,endofOver) {
    var nCross,tempBatter;

    if ( lastBall.isBlank() ) {
        // Cant guess. as blank !!!
        this.batterCode = '';
        this.nonStrikerCode = '';
        return;
    }

    // If odd number of Crosses. Switch batterCode <=> nonStrikerCode
    nCross = lastBall.nCross;
    if ( endofOver ) nCross++; // Bowlers are switching ends

    this.batterCode = lastBall.batterCode;
    this.nonStrikerCode = lastBall.nonStrikerCode;

    if ( lastBall.dismissal == 'w' ) {
        if ( lastBall.dismissalBy == 'U' || // Retired No striker
             lastBall.dismissalBy == 'R' ) // Run-out Non striker
            this.nonStrikerCode = '';
        else
            this.batterCode = '';
    }
    if ( (nCross % 2) == 1 ) {
        tempBatter = this.batterCode;
        this.batterCode = this.nonStrikerCode;
        this.nonStrikerCode = tempBatter;
    }
};

// ======================================================================

function Over(config) {
    if ( !(this instanceof Over) ) { // If invoked as a factory by mistake
        console.debug('Over not called with new');
        return new Over();
    }

    this.balls=[];
    this.nBalls = 0;
    this.nRuns = 0;
    this.nWides = 0;
    this.nNoball = 0;
    this.nBye = 0;
    this.nLbye = 0;
    this.bowlerCode = '';

    if ( config ) {
        for (var k in config)
            this[k] = config[k];
        for (var bIdx=0;bIdx<this.balls.length;bIdx++) {
            if (!(this.balls[bIdx] instanceof Ball)) { // Not a Ball Object. // Used when loading..
                this.balls[bIdx] = new Ball(this.balls[bIdx]);
            }
        }
    }
    while ( this.balls.length < 6 ) // Min 6 balls an over
      this.balls.push( new Ball() );
}

Over.prototype.getRunsNWickets = function() {
    var retval=this.code + ': ' + String(
        this.nRuns +
        this.nWides +
        this.nNoball +
        this.nBye +
        this.nLbye );
    if ( this.nWickets > 0 )
        retval += ('/' + String(this.nWickets));
    return retval;
};

Over.prototype.getName = function() {
    var name='Over # ' + String(this.code);
    if ( this.code === 0 ) name = 'Current Over';
    return name +' (' + this.getRunsNWickets() + ')';

};

Over.runScore = 0;
Over.runWickets = 0;

Over.prototype.getRunTotal = function() {
    if ( this.code == '1' ) {
        // Hack for a running total.
        Over.runScore = 0;
        Over.runWickets = 0;
    }
    Over.runScore += this.nRuns+this.nBye+this.nLbye+this.nNoball+this.nWides;
    Over.runWickets += this.nWickets;
    return String(this.code) +':' + String(Over.runScore) + '/' + String(Over.runWickets);
};



// calculate internal variables etc..
Over.prototype.recalc = function() {
    var bIdx,ball;
    this.nOvers = 0; // Not started
    this.nBalls = 0;
    this.nMaiden = 0;
    this.nRuns = 0;
    this.nWickets = 0;
    this.nNoball = 0;
    this.nWides = 0;

    this.nBye = 0;
    this.nLbye = 0;

    this.nBallsRequired = 6;

    for (bIdx=0;bIdx<this.balls.length;bIdx++) {
        ball = this.balls[bIdx];

        ball.code=this.code + '.' + String(bIdx+1);

        this.nBalls += ball.nBalls;
        this.nRuns += ball.nRuns;
        this.nWickets += ball.nWickets;
        this.nNoball += ball.nNoball;
        if ( ball.nNoball > 0 ) // We  have > 1, if hey ran byes of it.
          this.nBallsRequired++;
        this.nWides += ball.nWides;
        if ( ball.nWides > 0 ) // We  have > 1, if hey ran byes of it.
          this.nBallsRequired++;

        this.nBye += ball.nBye;
        this.nLbye += ball.nLbye;
    }
    if ( this.nBallsRequired > 8 )
        this.nBallsRequired = 8;


    if ((this.nBalls > 0 ) &&
        (this.nRuns === 0) &&
        (this.nNoball === 0) &&
        (this.nWides === 0) )
        this.nMaiden = 1;

    if ( (this.nBalls ) > 0 )
       this.nOvers++;

    // Add to Make the correct number of balls. in an Over.
    while ( this.nBallsRequired > this.balls.length ) {
        this.balls.push(new Ball());
    }
    // Delete (blanks) to Make the correct number of balls. in an Over.
    // DONT do this. if you manually add you need to manually delete.
    return this;
};


Over.prototype.getMarkup = function() {
    var bIdx,markup='';
    for (bIdx=0;bIdx<this.balls.length;bIdx++) {
       markup += this.balls[bIdx].getMarkup();
    }
    return markup;
};


Over.prototype.getMarkup4batterCode = function(batterCode) {
    var bIdx,markup='',ball,addComma=false,isMyDismissal=false;
    for (bIdx=0;bIdx<this.balls.length;bIdx++) {
        ball = this.balls[bIdx];
        // if ( ball.nBFaced > 0 ) {
        if ( ball.batterCode == batterCode ) {
           if ( addComma ) markup += ',';// Comma is a switch ends
           addComma =false;
           markup += ball.getMarkup();
        } else {
            if ( markup.length > 0 ) addComma =true;
        }
        if ( ball.dismissal == 'w' ) {
            // A Wicket !!!
            if ( ball.dismissalBy == 'R' || ball.dismissalBy == 'U' ) {
                isMyDismissal=( ball.nonStrikerCode == batterCode );
            } else {
                isMyDismissal=( ball.batterCode == batterCode );
            }
            if ( isMyDismissal ) {
                if ( ball.dismissalBy )
                  markup += ' - ' + Ball.dismissalMap[ball.dismissalBy];
                else
                  markup += ' - Dismissal';
                if (ball.dismissalFielderId) {
                    // Ahhh!! Using the app variable  !!! FIXUP !!
                    markup += ' f-' + app.bowlerCodeMap[ball.dismissalFielderId].name;
                }
                if (this.bowlerCode) {
                    // Ahhh!! Using the app variable  !!! FIXUP !!
                    markup += ' b-' + app.bowlerCodeMap[this.bowlerCode].name;
                }
            }
        }
    }
    return markup;
};


Over.prototype.atEndOfOver = function() {

    return ( this.nBalls >= this.nBallsRequired );
};

function Bowler(config) {
    if ( !(this instanceof Bowler) ) { // If invoked as a factory by mistake
        console.debug('Bowler not called with new');
        return new Bowler();
    }
    this.name = 'Bowler X';
    this.code = '';
    this.clear();

    if ( config )
        for (var k in config)
          this[k] = config[k];

}

Bowler.prototype.clear = function() {
    this.overs = [];

    this.nOvers = 0;
    this.nBalls = 0;
    this.nMaiden = 0;
    this.nRuns = 0;
    this.nWickets = 0;
    this.nNoball = 0;
    this.nWides = 0;

    this.nBye = 0;
    this.nLbye = 0;
    this.econ = 0;

    this.markup = '';
};

function Batter(config) {
    if ( !(this instanceof Batter) ) { // If invoked as a factory by mistake
        console.debug('Batter not called with new');
        return new Batter();
    }
    this.name = '<blank>';
    this.code = '';
    this.clear();

    if ( config )
        for (var k in config)
          this[k] = config[k];

}

// Wicket methods



Batter.prototype.clear = function() {
    this.overs = []; // Overs I am involved with !!

    this.nBalls = 0;
    this.nBFaced = 0;
    this.nRuns = 0;
    this.n4s = 0;
    this.n6s = 0;

    this.strikeRate = 0;


    this.markup = '';
};

//================================================

app.renderNOW = function() {
    console.log('renderNOW');
    this.render_queued=false;
    if ( !app.render_containerElement  )
        app.render_containerElement = window.document.body;
    vmrLite.render(app.render_containerElement, this);
};

app.render = function(containerElement) {
    if ( !this.render_queued ) {
        this.render_queued=true;
        if ( typeof(containerElement) == 'string')
            containerElement=$eid(containerElement);

        this.render_containerElement=containerElement; // Render just this div.
        // Render when finished, all computations.
        // DONT rennder immediately. As might call this several times.
        // A waste of cpi/time.
        // I.e. you only need to update when finished and ready for next user action.
        window.setTimeout(this.renderNOW.bind(this), 10);
    }
    if ( containerElement !== this.render_containerElement )
        this.render_containerElement = null; // Render all, the body
};

app.sync = function() {
    vmrLite.sync(window.document.body, this);
};

app.getPartner1 = function() {
    // Try and keep partners in the same position.
    // So names dont keep moving.
    if ( this.currBall ) {
        if (( this.partner1Code == this.currBall.batterCode ) ||
            ( this.partner1Code == this.currBall.nonStrikerCode &&
                this.partner1Code != this.partner2Code )) {
                // partner1Code OK
        } else {
            // partner1Code WRONG.
            if ( this.partner2Code == this.currBall.nonStrikerCode ) { // Batter is on the screen already
                this.partner1Code = this.currBall.batterCode; // Change to the nonStriker
            } else {
                this.partner1Code = this.currBall.nonStrikerCode;
            }
        }
    }
    return this.batterCodeMap[this.partner1Code]  || this.batterBlank;
};


app.getPartner2 = function() {
    // getPartner2 and keep partners in the same position.
    if ( this.currBall ) {
        if (( this.partner2Code == this.currBall.nonStrikerCode ) ||
            ( this.partner2Code == this.currBall.batterCode &&
                this.partner1Code != this.partner2Code )) {
                // partner2Code OK
        } else {
            // partner2Code WRONG.
            if ( this.partner1Code == this.currBall.batterCode ) { // Batter is on the screen already
                this.partner2Code = this.currBall.nonStrikerCode; // Change to the nonStriker
            } else {
                this.partner2Code = this.currBall.batterCode;
            }
        }
    }

    return this.batterCodeMap[this.partner2Code]  || this.batterBlank;
};

app.getBowler = function() {
    // Try and keep partners in the same position.
    var bowlerCode = null;
    if ( this.currOver ) {
        bowlerCode = this.currOver.bowlerCode;
    }
    return this.bowlerCodeMap[bowlerCode]  || this.bowlerBlank;
};


app.fmtNumber = function(n) {
    if ( n === 0 || n === '' ) return '&middot;';
    return String(n);
};


app.getTitle = function() {
    return this.properties.homeName + ' vs ' + this.properties.awayName;
};

// Recalc everything, based on a change
// TODO: Optimize for a New Ball
app.REBUILD = function() {
    var bIdx,oIdx,bowler,batter,over,ball;

    this.nOvers = 0;
    this.nBalls = 0;
    this.nRuns = 0;
    this.nMaiden = 0;

    this.nNoball = 0;
    this.nWides = 0;

    this.nBye = 0;
    this.nLbye = 0;
    this.nWickets = 0;


    this.bowlerCodeMap = {};
    for (bIdx=0;bIdx<this.bowlers.length;bIdx++) {
        this.bowlers[bIdx].clear();
        if ( !this.bowlers[bIdx].code )
            this.bowlers[bIdx].code = 'A' + bIdx.toString(16).toUpperCase();
        this.bowlerCodeMap[this.bowlers[bIdx].code] = this.bowlers[bIdx];
    }

    this.batterCodeMap = {};
    for (bIdx=0;bIdx<this.batters.length;bIdx++) {
        this.batters[bIdx].clear();
        if ( !this.batters[bIdx].code )
            this.batters[bIdx].code =  'H' + bIdx.toString(16).toUpperCase();
        this.batterCodeMap[this.batters[bIdx].code] = this.batters[bIdx];
    }

    for (oIdx=0;oIdx<this.overs.length;oIdx++) {
        over=this.overs[oIdx];
        over.code = String(oIdx+1);
        over.recalc();

        // Build up the list of overs the Bowler is involved  with
        if ( over.bowlerCode ) {
            bowler=this.bowlerCodeMap[over.bowlerCode];
            bowler.overs.push(over);

            bowler.nOvers += over.nOvers;
            bowler.nBalls += over.nBalls;
            bowler.nMaiden += over.nMaiden;
            bowler.nRuns += over.nRuns;
            bowler.nWickets += over.nWickets;
            bowler.nNoball += over.nNoball;
            bowler.nWides += over.nWides;

            bowler.nBye += over.nBye;
            bowler.nLbye += over.nLbye;

            if ( bowler.nOvers > 0)
                bowler.econ = ((bowler.nRuns+bowler.nNoball+bowler.nWides) / bowler.nOvers).toFixed(1);
        }

        // Build up the list of overs the Batter is envolved with
        for (bIdx=0;bIdx<over.balls.length;bIdx++) {
            ball=over.balls[bIdx];
            ball.code = over.code + '.' + String(bIdx+1);
            if ( ball.batterCode ) {
                batter=this.batterCodeMap[ball.batterCode];

                batter.nBalls += ball.nBalls;
                batter.nBFaced += ball.nBFaced;
                batter.nRuns += ball.nRuns;
                batter.n4s += ball.n4s;
                batter.n6s += ball.n6s;
                if ( batter.nBFaced > 0)
                    batter.strikeRate  = (batter.nRuns*100 / batter.nBFaced).toFixed(0);


                // Add to list of overs a batter is involved with
                if ( batter.overs[batter.overs.length-1] !== over )
                    batter.overs.push(over);
            }
            // Check for Run-outs, on the Non-Striker !!
            if (( ball.nonStrikerCode ) && ( ball.dismissal == 'w' ) &&
                   ( ball.dismissalBy == 'R' || ball.dismissalBy == 'U' )) {
                batter=this.batterCodeMap[ball.nonStrikerCode];
                // Add to list of overs a batter is involved with
                if ( batter.overs[batter.overs.length-1] !== over )
                    batter.overs.push(over);
            }
        }

        this.nOvers += over.nOvers;
        this.nBalls += over.nBalls;
        this.nMaiden += over.nMaiden;
        this.nRuns += over.nRuns;
        this.nWickets += over.nWickets;
        this.nNoball += over.nNoball;
        this.nWides += over.nWides;

        this.nBye += over.nBye;
        this.nLbye += over.nLbye;



    }
    // this.setPartnership();


    this.render();
};



// Change to next ball. If end of over set ball to null;
app.nextBall = function() {
    var bIdx,oIdx;

    for (bIdx=0;bIdx<this.currOver.balls.length;bIdx++)  {
        if ( this.currOver.balls[bIdx] === null )
              alert('NULL BALL IN LIST');
    }
    // Find ball in current over.
    for (bIdx=0;(bIdx<this.currOver.balls.length) && (this.currOver.balls[bIdx] != this.currBall);bIdx++) {
        // Nothing
    }

    if ( bIdx >= this.currOver.balls.length ) {
        // Ball not found.
        // Move onto 1st ball of next over.
        if ( this.currBall !== null ) { //  end-of-over
            console.log('ERROR nextBall this.currBallnot found');
        }

        // Find over
        for (oIdx=0;(oIdx<this.overs.length) && (this.overs[oIdx] != this.currOver );oIdx++) {
            // Nothing
        }
        if ( oIdx >= this.overs.length ) {
            console.log('ERROR nextBall this.currOver not found');
            oIdx=this.overs.length-1;
        }
        oIdx += 1;
        if ( oIdx >= this.overs.length ) {
            // No more overs. Stay on end-of-over (null) ball of the last over.
            return false;
        }
        this.currOver = this.overs[oIdx];
        this.currBall = this.currOver.balls[0];
        return true;
    }
    bIdx += 1;
    this.currBall = null; // Assume end-of-over
    if ( bIdx < this.currOver.balls.length ) {
        this.currBall = this.currOver.balls[bIdx];
    }

    return true;
};


// Change to previous ball.
app.prevBall = function() {
    var bIdx,oIdx;

    // Find ball in current over.
    for (bIdx=0;(bIdx<this.currOver.balls.length) && (this.currOver.balls[bIdx] != this.currBall);bIdx++) {
        // Nothing
    }
    if ( bIdx >= this.currOver.balls.length ) {
        // Ball not found.
        if ( this.currBall !== null ) { //  end-of-over
            console.log('ERROR nextBall this.currBall not found');
        }
        bIdx = this.currOver.balls.length-1;
        this.currBall = this.currOver.balls[bIdx];
        return true;
    }
    bIdx -= 1;
    if ( bIdx < 0 ) {
        // Find over
        for (oIdx=0;(oIdx<this.overs.length) && (this.overs[oIdx] != this.currOver );oIdx++) {
            // Nothing
        }
        if ( oIdx >= this.overs.length ) {
            console.log('ERROR prevBall this.currOver not found');
            oIdx=0;
        }
        oIdx -= 1;
        if ( oIdx < 0  ) {
            // No more overs. Stay on first ball of first over.
            return false;
        }
        this.currOver = this.overs[oIdx];
        bIdx = this.currOver.balls.length-1;
        // drop thru
    }
    this.currBall = this.currOver.balls[bIdx];
    return true;
};



app.setBattersBasedOnLastBall = function(lastBall,retvalBallsChanged) {
    var newbatterCode,tempbatterCode,nCross,orig_batterCode,orig_nonStrikerCode;

    orig_batterCode = this.currBall.batterCode;
    orig_nonStrikerCode = this.currBall.nonStrikerCode;

    // Work out the new batter. If changed
    outBatterCode = '';
    newbatterCode = '';
    if (( this.currBall.batterCode != lastBall.batterCode) &&
        ( this.currBall.batterCode != lastBall.nonStrikerCode)) {
        // batter is new
        newbatterCode = this.currBall.batterCode;
    } else
    if (( this.currBall.nonStrikerCode != lastBall.batterCode) &&
        ( this.currBall.nonStrikerCode != lastBall.nonStrikerCode)) {
        // nonStrikerCode is new
        newbatterCode = this.currBall.nonStrikerCode;
    }
    this.currBall.batterCode = lastBall.batterCode;
    this.currBall.nonStrikerCode = lastBall.nonStrikerCode;

    if ( lastBall.dismissal == 'w' ) {  // Had a wicket, Who was out.
        if ( lastBall.dismissalBy == 'U' || // Retired No striker
             lastBall.dismissalBy == 'R' ) // Run-out Non striker
            this.currBall.nonStrikerCode = newbatterCode;
        else
            this.currBall.batterCode = newbatterCode;
    }


    // If odd number of Crosses. Switch batterCode <=> nonStrikerCode
    nCross = lastBall.nCross;
    // If At the start of an over. Bowlers have switching ends
    if ( this.currOver.balls[0] == this.currBall ) nCross += 1;

    if ( (nCross % 2) == 1 ) {
        tempbatterCode = this.currBall.batterCode;
        this.currBall.batterCode =this.currBall.nonStrikerCode;
        this.currBall.nonStrikerCode = tempbatterCode;
    }
    if ( ! this.currBall.isBlank() ) {
        if (( orig_batterCode && orig_batterCode != this.currBall.batterCode ) ||
            ( orig_nonStrikerCode && orig_nonStrikerCode != this.currBall.nonStrikerCode )) {
            retvalBallsChanged.push(this.currBall.code);
            console.log('INFO: Changed batters for ball '  + this.currBall.code );
        }
    }
};

// Reset batters from currentBall to end of Innings
app.resetBattersToEndOfInnings = function() {
    // return;
    var PUSH_over,PUSH_ball,lastBall,ballsChanged;
    PUSH_over = this.currOver;
    PUSH_ball = this.currBall;


    ballsChanged=[];
    lastBall = this.currBall;
    if ( !lastBall  ) { // end-of-over, use last ball of over
         lastBall = this.currOver.balls[this.currOver.balls.length-1];
    }
    while ( this.nextBall() ) {
        if ( this.currBall ) { // skip end-of-over
            this.setBattersBasedOnLastBall(lastBall,ballsChanged);
            lastBall=this.currBall;
        }
    }
    if ( ballsChanged.length > 0 ) {
        alert('Batters updated for overs ' + ballsChanged.join(',') );
    }
    this.currOver = PUSH_over;
    this.currBall = PUSH_ball;
};

app.commitBall = function() {
    this.currBall.recalc();
    this.resetBattersToEndOfInnings();
    this.currOver.recalc();
    this.REBUILD();
    this.render();
};


app.onClickWas = function(ev) {

    var v = ev.target.getAttribute('value');
    if ( !v ) return;


    this.currBall.was = v;
    this.commitBall();

    ev.preventDefault(); ev.stopPropagation();
};

app.onClickDismissal = function(ev) {
    var v = ev.target.getAttribute('value');
    if ( !v ) return;

    if ( v == this.currBall.dismissal ) v = ''; // Toggle On/off
    this.currBall.dismissal = v;
    this.commitBall();

    ev.preventDefault(); ev.stopPropagation();
};

app.onClickCrossed = function(ev) {
    var v = ev.target.getAttribute('value');
    if ( !v ) return;

    if ( v == this.currBall.playersCrossed ) v = ''; // Toggle On/off

    this.currBall.playersCrossed = v;
    this.commitBall();

    ev.preventDefault(); ev.stopPropagation();
};


app.onClickRuns = function(ev) {
    var v = ev.target.getAttribute('value');
    if ( !v ) return;

    var wasBlank=( !this.currBall.was || !this.currBall.runs );

    if ( !this.currBall.was ) this.currBall.was = '-'; // Runs

    this.currBall.runs = v;
    this.commitBall();
    this.onClickBallNext(null);
    this.render();
    ev.preventDefault(); ev.stopPropagation();
};

app.onChangePartner = function(ev) {
    var v = ev.target.value;
    if ( ev.target.selected )
        this.currBall.batterCode = v;
    else
        this.currBall.nonStrikerCode = v;
    if ( !this.currBall.isBlank() ) app.commitBall();

    // this.currOver.recalc();
    // this.REBUILD();
    // this.render();
    ev.preventDefault(); ev.stopPropagation();
};

app.onChangeDismissalBy = function(ev) {
    var v = ev.target.value;
    this.currBall.dismissalBy = v;
    if ( !this.currBall.isBlank() ) app.commitBall();

    vmrLite.render($eid('ball'),this);

    ev.preventDefault(); ev.stopPropagation();
};

app.onChangeDismissalFielderId = function(ev) {
    var v = ev.target.value;
    this.currBall.dismissalFielderId = v;
    this.currBall.recalc();
    this.currOver.recalc();
    this.REBUILD();
    this.render();
    ev.preventDefault(); ev.stopPropagation();
};


app.onChangeBowler = function(ev) {
    var v = ev.target.value;
    this.currOver.bowlerCode = v;
    this.currOver.recalc();
    this.REBUILD();
    this.render();
    ev.preventDefault(); ev.stopPropagation();
};


// Next/Add Ball, Called when numberPressed
app.onClickBallNext = function(ev) {
    var bIdx;

    if ( this.currBall && !this.currBall.isBlank()  && ( !this.currBall.batterCode || !this.currBall.nonStrikerCode )) {
        alert('Please specify Batters');
        return;
    }

    this.nextBall();
    if ( ev ) {
        this.render('ballNover');
        ev.preventDefault(); ev.stopPropagation();
    }
};


app.onClickOverNext = function(ev) {
    var fromOver,newOver;

    if ( !this.currOver.bowlerCode) {
        alert('Please specify Bowler');
        return;
    }

    fromOver = this.currOver;
    while ( this.nextBall() && ( this.currOver == fromOver )) {
        /* Keep going, get next ball */
    }
    if ( this.currOver == fromOver )  {
        // Over did not change. No More Overs
        this.saveInnings('Auto Save @ New-Over');
        // Add over
        newOver = new Over(); // Dont change over. It messes up resetBatters
        this.overs.push(newOver);
        newOver.code = String(this.overs.length);
        newOver.recalc();

        // We should still be sitting on the end-of-over ball, on the last over.
        this.resetBattersToEndOfInnings();

        this.nextBall(); // Goto 1st ball of newOver.
    }
    this.render();
    ev.preventDefault(); ev.stopPropagation();
};


// Insert a ball before the current ball.
app.onClickBallAdd = function(ev) {
    var bIdx,newBall;
    if ( !this.currBall )
        this.prevBall();

    // Find the ball in the list of balls in this over.
    for (bIdx=0;(bIdx<this.currOver.balls.length) && (this.currOver.balls[bIdx] != this.currBall);bIdx++) {
        // Nothing
    }
    if ( bIdx >= this.currOver.balls.length ) {
        alert('Cannot find current ball');
    }

    // Add, must be a extra ball in the over. FIRE the ump.
    newBall = new Ball();
    // Add after the ball we are on
    this.currOver.balls.splice(bIdx+1,0,newBall);
    // this current ball is good.
    this.resetBattersToEndOfInnings();
    this.currOver.recalc();
    this.nextBall();
    this.render('ballNover');
    ev.preventDefault(); ev.stopPropagation();
};

app.onClickBallPrev = function(ev) {
    var bIdx;

    if ( this.currBall && !this.currBall.isBlank() && ( !this.currBall.batterCode || !this.currBall.nonStrikerCode )) {
        alert('Please specify Batters');
        return;
    }
    this.prevBall();
    this.render('ballNover');
    ev.preventDefault(); ev.stopPropagation();
};

app.onClickOverPrev = function(ev) {
    var fromOver;

    if ( !this.currOver.bowlerCode) {
        alert('Please specify Bowler');
        return;
    }

    fromOver = this.currOver;
    while ( this.prevBall() && ( this.currOver == fromOver )) {
        /* Keep going, get prev ball */
    }

    this.render();
    ev.preventDefault(); ev.stopPropagation();
};



app.onClickBallDelete = function(ev) {
    var bIdx,fromOver;

    // Find the ball in the list of balls in this over.
    for (bIdx=0;(bIdx<this.currOver.balls.length) && (this.currOver.balls[bIdx] != this.currBall);bIdx++) {
        // Nothing
    }
    if ( bIdx<this.currOver.balls.length ) {
        fromOver=this.currOver;

        // Go back 1 ball
        this.prevBall(); // May change this.currOver !!!
        // Delete It
        fromOver.balls.splice(bIdx,1);
        fromOver.recalc(); // <== Will add balls to make 6/8
        // Apply changes
        this.resetBattersToEndOfInnings();
        // Next Ball
        this.nextBall();
        if ( !this.currBall  ) this.nextBall();

    } else {
        alert('CANNOT find the ball to delete !!!');
    }
    this.REBUILD();
    this.render();
    ev.preventDefault(); ev.stopPropagation();

};

app.onClickBallSelected = function(ev) {
    var bIdx = ev.target.getAttribute('index');

    if ( !bIdx ) bIdx = ev.target.parentElement.getAttribute('index');
    if ( !bIdx  ) {
        return;
    }
    this.currBall = this.currOver.balls[bIdx];
    this.render('ballNover');

    ev.preventDefault(); ev.stopPropagation();
};

app.onClickOverSelect = function(ev) {
    var oIdx = ev.target.getAttribute('index');

    if ( !oIdx ) oIdx = ev.target.parentElement.getAttribute('index');
    if ( !oIdx  ) {
        return;
    }
    this.currOver = this.overs[oIdx];
    this.render();

    ev.preventDefault(); ev.stopPropagation();
};

app.saveInnings = function(overRideName) {
    var bIdx, save_ball, save_over;
    // Delete items We dont persist.
    for (bIdx=0;bIdx<this.bowlers.length;bIdx++) {
        delete this.bowlers[bIdx].overs;
    }
    for (bIdx=0;bIdx<this.batters.length;bIdx++) {
        delete this.batters[bIdx].overs;
    }

    var jsonString =  JSON.stringify( {
        properties : this.properties,
        overs : this.overs,
        bowlers : this.bowlers,
        batters : this.batters
        },null,' ');

    var iname=this.getTitle();
    if ( overRideName )
        iname = overRideName;
    // Clone. So this Saved item is 1st.
    // I Know an object does "in theory" have an order.
    var newList={};

    newList[iname]='marker';
    for (var k in this.inningsList )
        newList[k]=this.inningsList[k];
    newList[iname] = this.properties.onDate;
    if ( !newList[iname] ) newList[iname] = null;

    this.inningsList = newList;

    window.localStorage.setItem('inningsList',JSON.stringify(this.inningsList));
    window.localStorage.setItem(iname,jsonString);

    this.REBUILD();
};

app.loadInnings = function(iname) {
    var i;

    var jsonString=window.localStorage.getItem(iname);
    //  console.log('LOADING')
    // console.log(jsonString);
    var json=JSON.parse(jsonString);

    this.properties =  json.properties;
    this.overs =[];
    for (i=0;i<json.overs.length;i++)
      this.overs.push(new Over(json.overs[i]));

    this.bowlers=[];
    for (i=0;i<json.bowlers.length;i++)
      this.bowlers.push(new Bowler(json.bowlers[i]));

    this.batters=[];
    for (i=0;i<json.batters.length;i++)
      this.batters.push(new Batter(json.batters[i]));

    // Goto last ball/last over
    this.currOver = this.overs[this.overs.length-1];

    i=this.currOver.balls.length-1;
    while ( (i >= 0) && this.currOver.balls[i].isBlank() )
        i--;
    i++;

    this.currBall = null;
    if ( i < (this.currOver.balls.length-1) )
        this.currBall = this.currOver.balls[i];
     this.REBUILD();
     this.render();
};

app.deleteInnings = function(iname) {

    delete app.inningsList[iname];
    window.localStorage.setItem('inningsList',JSON.stringify(app.inningsList));
    window.localStorage.removeItem(iname);
};

app.newInnings = function() {
    var i;

    this.properties = {
        homeName : 'Home',
        awayName : 'Away',
        onDate : (new Date()).toISOString().substr(0,10) };
    this.batterBlank = new Batter();
    this.bowlerBlank = new Bowler();
    this.bowlers = [];
    for (i=0;i<11;i++) {
        this.bowler = new Bowler();
        //this.bowler.code='00' + String(i+1);
        this.bowler.name=String.fromCharCode(80+i,112+i,112+i,112+i,112+i,112+i,112+i);  // "P"
        this.bowlers.push( this.bowler );
    }

    this.batters = [];
    for (i=0;i<11;i++) {
        this.batter = new Batter();
        //this.batter.code='00' + String(i+1);
        this.batter.name= String.fromCharCode(65+i,97+i,97+i,97+i,97+i,97+i,97+i,97+i);  // "A"

        this.batter.bcolor = '#FFCCFF'; // Red
        if ( (i%3) == 1)
            this.batter.bcolor = '#FFFFCC'; // Yellow
        if ( (i%3) == 2)
            this.batter.bcolor = '#CCFFFF'; // Blue/Green

        this.batters.push( this.batter );
    }
    this.batters[0].name = 'Jacob';
    this.batters[1].name = 'Mansil';
    this.batters[2].name = 'Joshep';
    this.batters[3].name = 'Liam';
    this.batters[4].name = 'Henry';
    this.batters[5].name = 'James';
    this.batters[6].name = 'Noah';
    this.batters[7].name = 'Ethan';
    this.batters[8].name = 'Thomas';
    this.batters[9].name = 'Lucas';
    this.batters[10].name = 'Max';

    this.bowlers[0].name = 'Samantha';
    this.bowlers[1].name = 'Ruby';
    this.bowlers[2].name = 'Emily';
    this.bowlers[3].name = 'Sophie';
    this.bowlers[4].name = 'Ella';
    this.bowlers[5].name = 'Amelia';
    this.bowlers[6].name = 'Chloe';
    this.bowlers[7].name = 'Mia';
    this.bowlers[8].name = 'Ava';
    this.bowlers[9].name = 'Olivia';
    this.bowlers[10].name = 'Lily';

    this.overs=[];
    this.currOver = new Over();
    this.overs.push(this.currOver);
    this.currBall = this.currOver.balls[0];
    this.REBUILD();
    this.currOver.bowlerCode = this.bowlers[0].code;
    this.currBall.batterCode = this.batters[0].code;
    this.currBall.nonStrikerCode = this.batters[1].code;
    this.partner1Code = this.currBall.batterCode;
};

app.init = function() {
    this.inningsList = {};

    var response=window.localStorage.getItem('inningsList');
    if ( response ) {
        this.inningsList = JSON.parse(response);
    }
    window.localStorage.setItem('inningsList',JSON.stringify(this.inningsList));
    this.newInnings();
    // this.testInnings();
    this.REBUILD();
    this.render();
};

app.getScore = function() {
    return this.nRuns+this.nBye+this.nLbye+this.nNoball+this.nWides;
};

app.onClickCloseModal = function(ev) {
    var nlist = document.querySelectorAll("div.modal-background");
    for (var i=0;i<nlist.length;i++)
        nlist[i].style.display = 'none';
};

app.onClickOpenPopoutMenu = function(ev) {
    $eid('popout_menu').style.display = 'block';
};

app.onClickClosePopouts = function(ev) {
    var nlist = document.querySelectorAll("div.popout");
    for (var i=0;i<nlist.length;i++)
        nlist[i].style.display = 'none';

    ev.preventDefault(); ev.stopPropagation();
    //  $eid('popout_menu').style.display = 'none';
};

app.onClickPopoutLoad = function(ev) {
    this.onClickClosePopouts(ev);
    $eid('popout_load').style.display = 'block';
};

app.onClickSaveToStorage = function(ev) {
    this.saveInnings();
    alert('Saved as ' + this.getTitle() );
    this.render();

    this.onClickClosePopouts(ev);
};

app.onClickNewInnings = function(ev) {
    // this.saveInnings();
    app.newInnings();
    this.render();

    this.onClickClosePopouts(ev); // Calls prevent/stop
};

app.onClickCloneInnings = function(ev) {
    this.saveInnings();
    var i,len;
    var fromInnings = {
        properties : this.properties,
        bowlers : this.bowlers,
        batters : this.batters
    };
    app.newInnings();
    // Copy Home <=> Away
    this.properties.homeName = fromInnings.properties.awayName;
    this.properties.awayName = fromInnings.properties.homeName;
    // Copy bowlers <=> batters but reverse the order

    len=fromInnings.batters.length;
    if ( this.bowlers.length < len ) len = this.bowlers.length;
    for (i=0;i<len;i++) {
        this.bowlers[i].name = fromInnings.batters[len-1-i].name.replace(/batter/i,'Bowler');
    }

    len=fromInnings.bowlers.length;
    if ( this.batters.length < len ) len = this.batters.length;
    for (i=0;i<len;i++) {
        this.batters[i].name = fromInnings.bowlers[len-1-i].name.replace(/Bowler/i,'Batter');
    }
    this.render();
    this.onClickClosePopouts(ev); // Calls prevent/stop
};

app.onClickLoadInnings = function(ev) {
    var iname = $eid('select_innings').value;
    this.loadInnings(iname);

    this.onClickClosePopouts(ev);
    // alert( this.getTitle()  + ' Loaded');

    app.render();
};

app.onClickDeleteInnings = function(ev) {
    var iname = $eid('select_innings').value;
    this.deleteInnings(iname);
    app.render();

    ev.preventDefault(); ev.stopPropagation();
};

app.onClickPopoutEditName = function(ev) {
    this.onClickClosePopouts(ev);
    var e=$eid('popout_editName');
    vmrLite.render(e,this);
    e.style.display = 'block';
};

app.onClickSaveName = function(ev) {
    var e=$eid('popout_editName');
    vmrLite.sync(e,this);
    e.style.display = 'none';
    app.render();
};

app.onClickPopoutEditBatters = function(ev) {
    this.onClickClosePopouts(ev);
    var e=$eid('popout_editBatters');
    vmrLite.render(e,this);
    e.style.display = 'block';

};

app.onClickSaveBatters = function(ev) {
    var e=$eid('popout_editBatters');
    vmrLite.sync(e,this);
    e.style.display = 'none';
    app.render();
};

app.onClickBatterMove = function(ev) {
    var i=vmrLite.closestIndex(ev.target);
    var dirn=parseInt(ev.target.getAttribute('data-dirn'));

    if ( i >= 0 )  {
        var j=i+dirn;
        if ( j >= this.batters.length ) j = 0; // Move-down to the top
        if ( j < 0 ) j = this.batters.length-1; // Move-up to the borrom
        var v = this.batters[j];
        this.batters[j]=this.batters[i];
        this.batters[i]=v;
    }
    this.render();
    ev.preventDefault(); ev.stopPropagation();
};

app.onClickPopoutEditBowlers = function(ev) {
    this.onClickClosePopouts(ev);
    var e=$eid('popout_editBowlers');
    vmrLite.sync(e,this);
    e.style.display = 'block';
};

app.onClickSaveBowlers = function(ev) {
    var e=$eid('popout_editBowlers');
    vmrLite.sync(e,this);
    e.style.display = 'none';
    app.render();
};

app.onClickBowlerMove = function(ev) {
    var i=vmrLite.closestIndex(ev.target);
    var dirn=parseInt(ev.target.getAttribute('data-dirn'));

    if ( i >= 0 )  {
        var j=i+dirn;
        if ( j >= this.bowlers.length ) j = 0; // Move-down to the top
        if ( j < 0 ) j = this.bowlers.length-1; // Move-up to the borrom
        var v = this.bowlers[j];
        this.bowlers[j]=this.bowlers[i];
        this.bowlers[i]=v;
    }
    this.render();
    ev.preventDefault(); ev.stopPropagation();
};

app.onClickPopoutAbout = function(ev) {
    this.onClickClosePopouts(ev);
    var e=$eid('popout_about');
    vmrLite.sync(e,this);
    e.style.display = 'block';
};