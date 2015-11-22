"use strict";

/* global window, console, document, module, vmrLite, $eid, alert */


// ======================================================================


var app={};

app._id = '123456';



function Ball(config) {
    if (!(this instanceof Ball)) { // If invoked as a factory by mistake
        console.debug('Ball not called with new');
        return new Ball();
    }    
    this.was='';
    this.runs='';
    this.out='';
    this.batterId = '';
    this.nonStrikerId = '';

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

    this.dismissal=''; // blank or 'w' (for Wicket)
    this.dismissalCrossed='';
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
        this.dismissalCrossed='';
        this.dismissalBy='';
        this.dismissalFielderId='';
    } else {
        // A Dismissal
        this.nWickets=1;
        if (!(this.dismissalBy=='c'||this.dismissalBy=='+')) // NOT Caught OR C+B
            this.dismissalCrossed=''; // Crossed is N/a
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
    return this;
};



Ball.prototype.isBlank = function() {
    this.recalc();
    return ( !this.was || !this.runs );
};

Ball.prototype.getName = function() {
    if ( this.id === 0 ) return 'Next Ball';
    return 'Ball #' + String(this.id);
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

Ball.prototype.setBatterBasedOnLastBall = function(lastBall,endofOver) {
    var nCross,tempBatter;

    if ( lastBall.isBlank() ) {
        // Cant guess. as blank !!! 
        this.batterId = '';
        this.nonStrikerId = '';
        return;
    }

    // Set the batterId based on the last ball.
    nCross = lastBall.nRuns;
    nCross += lastBall.nBye;
    nCross += lastBall.nLbye;
    if ( lastBall.nNoball > 0  )
      nCross += ( lastBall.nNoball - 1);
    if ( lastBall.nWides > 0  )
      nCross += ( lastBall.nWides - 1);
    // If odd number of Crosses. Switch batterId <=> nonStrikerId
    if ( endofOver )  nCross++; // Bowlers are switching ends
    this.batterId = lastBall.batterId;
    this.nonStrikerId = lastBall.nonStrikerId;
    if ( lastBall.dismissal == 'w' ) { 
        if ( lastBall.dismissalCrossed == 'x' ) nCross++;
        if ( lastBall.dismissalBy == 'U' || // Retired No striker
             lastBall.dismissalBy == 'R' ) // Run-out Non striker
            this.nonStrikerId = '';
        else
            this.batterId = '';
    }
    if ( (nCross % 2) == 1 ) {
        tempBatter = this.batterId;
        this.batterId = this.nonStrikerId;
        this.nonStrikerId = tempBatter;
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
    this.bowlerId = '';

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

Over.prototype.getName = function() {
    var name='Over # ' + String(this.id);
    if ( this.id === 0 ) name = 'Current Over';
    return name +' (' + String(
        this.nRuns +
        this.nWides +
        this.nNoball +
        this.nBye +
        this.nLbye ) + 
            '/' + String(this.nWickets) + ')';

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

        ball.id=this.id + '.' + String(bIdx+1);

        this.nBalls += ball.nBalls;
        this.nRuns += ball.nRuns;
        this.nWickets += ball.nWickets;
        this.nNoball += ball.nNoball;
        if ( ball.nNoball > 0 ) // We have have > 1, if hey ran byes of it.
          this.nBallsRequired++;
        this.nWides += ball.nWides;
        if ( ball.nWides > 0 ) // We have have > 1, if hey ran byes of it.
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

     
Over.prototype.getMarkup4BatterId = function(batterId) {
    var bIdx,markup='',ball,addComma=false,isMyDismissal=false;
    for (bIdx=0;bIdx<this.balls.length;bIdx++) {  
        ball = this.balls[bIdx];
        // if ( ball.nBFaced > 0 ) {
        if ( ball.batterId == batterId ) {    
           if ( addComma ) markup += ',';// Comma is a switch ends 
           addComma =false;    
           markup += ball.getMarkup();
        } else {
            if ( markup ) addComma =true;
        }
        if ( ball.dismissal == 'w' ) {
            // A Wicket !!!
            if ( ball.dismissalBy == 'R' || ball.dismissalBy == 'U' ) {
                isMyDismissal=( ball.nonStrikerId == batterId );
            } else {
                isMyDismissal=( ball.batterId == batterId );
            }
            if ( isMyDismissal ) {
                if ( ball.dismissalBy )
                  markup += ' - ' + Ball.dismissalMap[ball.dismissalBy];
                else 
                  markup += ' - Dismissal';
                if (ball.dismissalFielderId) {
                    // Ahhh!! Using the app variable  !!! FIXUP !!
                    markup += ' f-' + app.bowlerIdMap[ball.dismissalFielderId].name;
                }
                if (this.bowlerId) {
                    // Ahhh!! Using the app variable  !!! FIXUP !!
                    markup += ' b-' + app.bowlerIdMap[this.bowlerId].name;
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
    this.id = '';
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
    this.id = '';
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
    this.render_queued=false;
    var body=window.document.body;
    // if ( app.render_divId )
    //     body=window.document.getElementById(app.render_divId);
    vmrLite.render(body, this);    
};

app.render = function(divId) {
    if ( !app.render_queued ) {
        app.render_queued=true;
        app.render_divId=divId; // Render just this div.
        // Render when finished, all computations.
        // DONT rennder immediately. As might call this several times.
        // A waste of cpi/time. 
        // I.e. you only need to update when finished and ready for next user action.
        window.setTimeout(app.renderNOW.bind(app), 0);
    }
    if ( divId !== app.render_divId )
        app.render_divId = null; // Render all, the body
};

app.sync = function() {
    vmrLite.sync(window.document.body, this);    
};





app.setPartnership = function() {
    var id1='000', id2='000';
    if ( this.partner1 )
        id1 = this.partner1.id;
    if ( this.partner2 )
        id2 = this.partner2.id;
    if ( this.ball ) {
        if (( this.ball.batterId == id1 || this.ball.batterId == id2 ) &&
            ( this.ball.nonStrikerId == id1 || this.ball.nonStrikerId == id2 ))
            return; // All OK
        this.partner1 = this.batterIdMap[this.ball.batterId];
        this.partner2 = this.batterIdMap[this.ball.nonStrikerId];
    }
};



app.getPartner1 = function() {
    // Try and keep partners in the same position. 
    // So names dont keep moving.
    if ( this.ball ) {
        if (( this.partner1Id == this.ball.batterId ) ||
            ( this.partner1Id == this.ball.nonStrikerId && 
                this.partner1Id != this.partner2Id )) {
                // Partner1ID OK
        } else {
            // Partner1ID WRONG.
            if ( this.partner2Id == this.ball.nonStrikerId ) { // Batter is on the screen already
                this.partner1Id = this.ball.batterId; // Change to the nonStriker
            } else {
                this.partner1Id = this.ball.nonStrikerId;
            }
        }
    }
    return this.batterIdMap[this.partner1Id]  || this.batterBlank;
};


app.getPartner2 = function() {
    // getPartner2 and keep partners in the same position.
    if ( this.ball ) {
        if (( this.partner2Id == this.ball.nonStrikerId ) ||
            ( this.partner2Id == this.ball.batterId && 
                this.partner1Id != this.partner2Id )) {
                // Partner2ID OK
        } else {
            // Partner2ID WRONG.
            if ( this.partner1Id == this.ball.batterId ) { // Batter is on the screen already
                this.partner2Id = this.ball.nonStrikerId; // Change to the nonStriker
            } else {
                this.partner2Id = this.ball.batterId;
            }
        }
    }

    return this.batterIdMap[this.partner2Id]  || this.batterBlank;
};

app.getBowler = function() {
    // Try and keep partners in the same position.
    var bowlerId = null;
    if ( this.over ) {
        bowlerId = this.over.bowlerId;
    }
    return this.bowlerIdMap[bowlerId]  || this.bowlerBlank;
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


    this.bowlerIdMap = {};    
    for (bIdx=0;bIdx<this.bowlers.length;bIdx++) {
        this.bowlers[bIdx].clear();
        this.bowlerIdMap[this.bowlers[bIdx].id] = this.bowlers[bIdx];
    }    

    this.batterIdMap = {};    
    for (bIdx=0;bIdx<this.batters.length;bIdx++) {
        this.batters[bIdx].clear();
        this.batterIdMap[this.batters[bIdx].id] = this.batters[bIdx];
    }    

    for (oIdx=0;oIdx<this.overs.length;oIdx++) {
        over=this.overs[oIdx];
        over.id = String(oIdx+1);
        over.recalc();
        // Build up the list of overs the Bowler is involved  with
        if ( over.bowlerId ) {
            bowler=this.bowlerIdMap[over.bowlerId];
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
            ball.id = over.id + '.' + String(bIdx+1);
            if ( ball.batterId ) {
                batter=this.batterIdMap[ball.batterId];

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
            if (( ball.nonStrikerId ) && ( ball.dismissal == 'w' ) && 
                   ( ball.dismissalBy == 'R' || ball.dismissalBy == 'U' )) {
                batter=this.batterIdMap[ball.nonStrikerId];
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
    this.setPartnership();



    this.render();
};



app.onClickWas = function(ev) {

    var v = ev.target.getAttribute('value');
    if ( !v ) return;

    // DONT default the runs !!
    // if ( v == 'b' ) this.ball.runs = '1'; // Bye
    // if ( v == 'l' ) this.ball.runs = '1'; // Leg-Bye
    // if ( v == 'n' ) this.ball.runs = '0'; // No-Ball
    // if ( v == 'N' ) this.ball.runs = '1'; // No-Ball (off bat, assume 1 run)
    // if ( v == 'w' ) this.ball.runs = '0'; // Wide

    this.ball.was = v;
    
    if ( !this.ball.recalc() ) { // No information on the ball
        this.render('ballNover');
        return;
    }
    this.over.recalc();
    this.REBUILD();
    this.render();

    ev.preventDefault(); ev.stopPropagation();
};




app.onClickRuns = function(ev) {
    var v = ev.target.getAttribute('value');
    if ( !v ) return;

    var wasBlank=( !this.ball.was || !this.ball.runs );

    if ( !this.ball.was ) this.ball.was = '-'; // Runs

    this.ball.runs = v;
    this.ball.recalc();
    this.over.recalc();
    this.REBUILD();    
    if ( this.ball !== this.over.balls[this.over.balls.length-1])
       this.onClickBallNext(ev);
    else 
       this.ball = null;        

    this.render();
    ev.preventDefault(); ev.stopPropagation();
};

// Next/Add Ball
app.onClickBallNext = function(ev) {
    var bIdx,lastBall,nextBall,nCross;

    if ( !this.ball.batterId || !this.ball.nonStrikerId ) {
        alert('Please specify Batters');
        return;
    }

    // Find the ball in the list of balls in this over.
    for (bIdx=0;(bIdx<this.over.balls.length) && (this.over.balls[bIdx] != this.ball);bIdx++) {
        // Nothing
    }  
    if ( bIdx >= this.over.balls.length ) {
        // Must be at end of over. 
        // alert('CANNOT find the current ball !!');  
        bIdx = this.over.balls.length-1;
    }
    lastBall=this.over.balls[bIdx];
    bIdx++;
    if ( bIdx<this.over.balls.length ) {
        // exists
        this.ball = this.over.balls[bIdx];
    } else {
        // Add, must be a extra ball in the over. FIRE the ump.
        this.ball = new Ball();
        this.over.balls.push(this.ball);

        this.over.recalc();
    }
    if ( this.ball.isBlank() && bIdx > 0 )
        this.ball.setBatterBasedOnLastBall(app.over.balls[bIdx-1]);

    this.render('ballNover');
    if ( ev ) {
        ev.preventDefault(); ev.stopPropagation();            
    }
};


// Insert a ball before the current ball.
app.onClickBallInsert = function(ev) {
    var bIdx;
    // Find the ball in the list of balls in this over.
    for (bIdx=0;(bIdx<this.over.balls.length) && (this.over.balls[bIdx] != this.ball);bIdx++) {
        // Nothing
    }  
    if ( bIdx >= this.over.balls.length ) {
        //alert('CANNOT find the current ball !!');
        //return;        
    }

    // Add, must be a extra ball in the over. FIRE the ump.
    this.ball = new Ball();
    this.over.balls.splice(bIdx,0,this.ball);
    if ( this.ball.isBlank()  && bIdx > 0 )
        this.ball.setBatterBasedOnLastBall(app.over.balls[bIdx-1]);    
    this.over.recalc();
    this.render('ballNover');
    ev.preventDefault(); ev.stopPropagation();    
};

app.onClickBallPrev = function(ev) {
    var bIdx;

    // Find the ball in the list of balls in this over.
    for (bIdx=0;(bIdx<this.over.balls.length) && (this.over.balls[bIdx] != this.ball);bIdx++) {
        // Nothing
    }  
    if ( bIdx >= this.over.balls.length ) {
        // Must be at end of over. 
        // Leave bIdx as this.over.balls.length
        // alert('CANNOT find the current ball !!');        
    }

    bIdx--;
    if ( bIdx >= 0 ) {
        // exists
        this.ball = this.over.balls[bIdx];
    } else  {
        // At the 1st already !!
        alert('At the beginning of the over');
    }
    if ( this.ball.isBlank()  && bIdx > 0 )
        this.ball.setBatterBasedOnLastBall(app.over.balls[bIdx-1]);    

    this.render('ballNover');
    ev.preventDefault(); ev.stopPropagation();    
};


app.onChangeBowler = function(ev) {
    var v = ev.target.value;
    this.over.bowlerId = v;
    this.over.recalc();
    this.REBUILD();
    this.render();    
    ev.preventDefault(); ev.stopPropagation();
};

app.onClickDismissal = function(ev) {
    var v = ev.target.getAttribute('value');
    if ( !v ) return;

    if ( v == this.ball.dismissal ) v = ''; // Toggle On/off
    this.ball.dismissal = v;
    this.ball.recalc();
    this.over.recalc();
    this.REBUILD();    
    this.render();
    ev.preventDefault(); ev.stopPropagation();
};

app.onChangeDismissalBy = function(ev) {
    var v = ev.target.value;
    this.ball.dismissalBy = v;
    this.ball.recalc();
    this.over.recalc();
    this.REBUILD();
    this.render();    
    ev.preventDefault(); ev.stopPropagation();
};

app.onChangeDismissalCrossed = function(ev) {
    var v = ev.target.value;
    this.ball.dismissalCrossed = '';
    if ( ev.target.checked )
         this.ball.dismissalCrossed = v;
    this.ball.recalc();
    this.over.recalc();
    this.REBUILD();
    this.render();    
    ev.preventDefault(); ev.stopPropagation();
};

app.onChangeDismissalFielderId = function(ev) {
    var v = ev.target.value;
    this.ball.dismissalFielderId = v;
    this.ball.recalc();
    this.over.recalc();
    this.REBUILD();
    this.render();    
    ev.preventDefault(); ev.stopPropagation();
};

app.switchBatterWithNonStriker = function() {
    console.log('switchBatterWithNonStriker');

    var v = this.ball.batterId;    
    this.ball.batterId = this.ball.nonStrikerId;
    this.ball.nonStrikerId = v;

    v = this.partner1Id;    
    this.partner1Id = this.ball.partner2Id;
    this.partner2Id = v;

};

app.onChangePartner = function(ev) {
    var v = ev.target.value;
    if ( this.ball )  {
        if ( ev.target.selected )  { // OnStrike, changed
            if ( this.ball.nonStrikerId == v ) { // Changed person onstrike, to the non-striker, switch players
              this.switchBatterWithNonStriker();
            }
            this.ball.batterId = v;
        } else {
            if ( this.ball.batterId == v ) { // Changed person  to the striker, switch players
              this.switchBatterWithNonStriker();
            }
            this.ball.nonStrikerId = v;
        }
    }
    this.over.recalc();
    this.REBUILD();
    this.render();    
    ev.preventDefault(); ev.stopPropagation();    
};

// Not used
app.onChangeBatter = function(ev) {
    var v = ev.target.value;
    this.ball.batterId = v;    
    if ( this.ball.batterId == this.ball.nonStrikerId )
        this.ball.nonStrikerId = '';

    this.over.recalc();
    this.REBUILD();
    this.render();    
    ev.preventDefault(); ev.stopPropagation();
};

// Not used
app.onChangeNonStrike = function(ev) {
    var v = ev.target.value;    
    this.ball.nonStrikerId = v;    
    if ( this.ball.batterId == this.ball.nonStrikerId )
        this.ball.batterId = '';    
    this.over.recalc();

    this.REBUILD();
    this.render();    
    ev.preventDefault(); ev.stopPropagation();
};

// Not used
app.onClickBattersCrossed = function(ev) {
    console.log('onClickBattersCrossed');

    var v = this.ball.batterId;    
    this.ball.batterId = this.ball.nonStrikerId;
    this.ball.nonStrikerId = v;
    this.over.recalc();
    this.REBUILD();
    this.render();    
    ev.preventDefault(); ev.stopPropagation();
};



app.onClickBallDelete = function(ev) {
    var bIdx;
 

    // Find the ball in the list of balls in this over.
    for (bIdx=0;(bIdx<this.over.balls.length) && (this.over.balls[bIdx] != this.ball);bIdx++) {
        // Nothing
    }  
    if ( bIdx<this.over.balls.length ) {
        // found, Delete It
        this.over.balls.splice(bIdx,1);
        this.over.recalc(); // <== Will add balls to make 6/8
        // Set the current Ball.
        if ( bIdx < this.over.balls.length ) {
           this.ball = this.over.balls[bIdx];
        } else {
           this.ball = this.over.balls[this.over.balls.length-1];
        }
    } else {
        alert('CANNOT find the ball to delete !!!');
    }
    this.REBUILD();
    this.render();
    ev.preventDefault(); ev.stopPropagation();

};

app.onClickBall = function(ev) {
    var bIdx = ev.target.getAttribute('index');

    if ( !bIdx ) bIdx = ev.target.parentElement.getAttribute('index');
    if ( !bIdx  ) {
        return;
    }
    app.ball = app.over.balls[bIdx];
    if ( this.ball.isBlank()  && bIdx > 0 )
        this.ball.setBatterBasedOnLastBall(app.over.balls[bIdx-1]);
    this.render('ballNover');

    ev.preventDefault(); ev.stopPropagation();
};

app.onClickOverNext = function(ev) {
    var oIdx,lastBall;

    // Find the over in the list of ALL overs
    for (oIdx=0;(oIdx<this.overs.length) && (this.overs[oIdx] != this.over);oIdx++) {
        // Nothing
    }  
    if ( oIdx >= this.overs.length ) {
        alert('Current over NOT FOUND');
        oIdx=this.overs.length-1;
    }
    if ( !this.over.bowlerId) {
        alert('Please specify Bowler');
        return;
    }
    lastBall=this.overs[oIdx].balls[this.overs[oIdx].balls.length-1];
    oIdx++;
    if ( oIdx<this.overs.length ) {
        // exists
        this.over = this.overs[oIdx];
    } else {
        this.saveInnings('Auto Save @ New-Over');
        // Add, 
        this.over = new Over();
        this.overs.push(this.over);
        this.over.id = String(this.overs.length);
        this.over.recalc();
        // Dont know the bowler. Yet.
    }
    this.bowler=this.bowlerIdMap[this.over.bowlerId];
    this.ball=this.over.balls[0];
    if ( this.ball.isBlank() ) {
        this.ball.setBatterBasedOnLastBall(lastBall,true);
    }

    this.render();  
    ev.preventDefault(); ev.stopPropagation();
};

app.onClickOverPrev = function(ev) {
    var oIdx;
    
    // Find the over in the list of ALL overs
    for (oIdx=0;(oIdx<this.overs.length) && (this.overs[oIdx] != this.over);oIdx++) {
        // Nothing
    }  
    if ( oIdx >= this.overs.length ) {
        alert('Current over NOT FOUND');
    }
    oIdx--;
    if ( oIdx >= 0 ) {
        // exists
        this.over = this.overs[oIdx];
        this.ball = this.over.balls[this.over.balls.length-1];
        this.bowler = app.bowlerIdMap[this.over.bowlerId];
        if ( this.ball.isBlank() )
            this.ball.setBatterBasedOnLastBall(app.over.balls[this.over.balls.length-2]);        
    } else {
        // At the 1st already !!
        alert('At the beginning of the innings');
    }
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
    console.log('inningsLis=',this.inningsList)

    window.localStorage.setItem('inningsList',JSON.stringify(this.inningsList));
    window.localStorage.setItem(iname,jsonString);

    this.REBUILD();
};



app.loadInnings = function(iname) {
    var i;
    // overs : this.overs,
    // bowlers : this.bowlers,
    // batters : this.batters,
    var jsonString=window.localStorage.getItem(iname);
    console.log(jsonString)
    var json=JSON.parse(jsonString);

    app.properties =  json.properties;
    app.overs =[];
    for (i=0;i<json.overs.length;i++)
      app.overs.push(new Over(json.overs[i]));

    app.bowlers=[];
    for (i=0;i<json.bowlers.length;i++)
      app.bowlers.push(new Bowler(json.bowlers[i]));

    app.batters=[];
    for (i=0;i<json.batters.length;i++)
      app.batters.push(new Batter(json.batters[i]));

    // Goto last ball/last over
    app.over = app.overs[app.overs.length-1];

    i=app.over.balls.length-1;
    while ( (i > 0) && app.over.balls[i].isBlank() )
        i--;
    app.ball = null;
    app.REBUILD();

    if ( i != (this.over.balls.length-1) ) {
        // NOT end of over
        this.ball = this.over.balls[i];
        this.onClickBallNext(null);
    }

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
        this.bowler.id='00' + String(i+1);
        this.bowler.name=String.fromCharCode(80+i,112+i,112+i,112+i,112+i,112+i,112+i);  // "P" 
        this.bowlers.push( this.bowler );    
    }

    this.batters = [];
    for (i=0;i<11;i++) {
        this.batter = new Batter();
        this.batter.id='00' + String(i+1);
        this.batter.name= String.fromCharCode(65+i,97+i,97+i,97+i,97+i,97+i,97+i,97+i);  // "A"

        this.batter.bcolor = '#FFCCFF'; // Red
        if ( (i%3) == 1)
            this.batter.bcolor = '#FFFFCC'; // Yellow
        if ( (i%3) == 2)
            this.batter.bcolor = '#CCFFFF'; // Blue/Green

        this.batters.push( this.batter );    
    }
    this.batters[0].name = 'Henry';
    this.batters[1].name = 'Jack';
    this.batters[2].name = 'James';
    this.batters[3].name = 'Liam';
    this.batters[4].name = 'William';
    this.batters[5].name = 'Noah';
    this.batters[6].name = 'Ethan';
    this.batters[7].name = 'Thomas';
    this.batters[8].name = 'Lucas';
    this.batters[9].name = 'Jacob';
    this.batters[10].name = 'Max';

    this.bowlers[0].name = 'Olivia';
    this.bowlers[1].name = 'Emily';
    this.bowlers[2].name = 'Sophie';
    this.bowlers[3].name = 'Ella';
    this.bowlers[4].name = 'Amelia';
    this.bowlers[5].name = 'Ruby';
    this.bowlers[6].name = 'Chloe';
    this.bowlers[7].name = 'Mia';
    this.bowlers[8].name = 'Ava';
    this.bowlers[9].name = 'Samantha';
    this.bowlers[10].name = 'Lily';



    this.overs=[];
    this.over = new Over();
    this.over.bowlerId = this.bowlers[0].id;
    this.overs.push(this.over);
    this.ball = this.over.balls[0];
    this.ball.batterId = this.batters[0].id;
    this.ball.nonStrikerId = this.batters[1].id;
    this.partner1Id = this.ball.batterId;
    this.REBUILD();     
};


app.testInnings = function() {
    var i;
    this.newInnings();

    this.name = 'Test vs Away';

    var bowler1=this.bowlers[0];
    var bowler2=this.bowlers[1];
    var batter1=this.batters[0];
    var batter2=this.batters[1];

    this.overs=[];

    for (i=0;i<5;i++) {
        // Some test data
        this.over=new Over();
        this.over.bowlerId=bowler1.id;

        this.over.balls[0].was = '-';
        this.over.balls[0].runs = '1';
        this.over.balls[0].batterId = batter1.id;    
        this.over.balls[0].recalc();

        this.over.balls[1].was = 'b';
        this.over.balls[1].runs = '1';
        this.over.balls[1].batterId = batter2.id;    
        this.over.balls[1].recalc();

        this.over.balls[2].was = 'n';
        this.over.balls[2].runs = '1';
        this.over.balls[2].batterId = batter1.id;    
        this.over.balls[2].recalc();

        this.overs.push(this.over);

        this.bowler.overs.push(this.over);
    }
    this.over=new Over();
    for ( i=0;i<6;i++) {
        this.over.balls[i].was = '-';
        this.over.balls[i].runs = String(i);
        this.over.balls[i].batterId = (i%2===0)? batter1.id : batter2.id;    
        this.over.balls[i].nonStrikerId = (i%2===0)? batter2.id : batter1.id;    
        this.over.balls[i].recalc();    
        this.ball = this.over.balls[i];
    }
    this.overs.push(this.over);


    this.REBUILD();     
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

    len=fromInnings.batters.length;
    if ( this.bowlers.length < len ) len = this.bowlers.length;
    for (i=0;i<len;i++) {
        this.bowlers[i].name = fromInnings.batters[i].name.replace(/batter/i,'Bowler');
    }

    len=fromInnings.bowlers.length;
    if ( this.batters.length < len ) len = this.batters.length;
    for (i=0;i<len;i++) {
        this.batters[i].name = fromInnings.bowlers[i].name.replace(/Bowler/i,'Batter');
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

app.onClickPopoutAbout = function(ev) {
    this.onClickClosePopouts(ev);
    var e=$eid('popout_about');
    vmrLite.sync(e,this);
    e.style.display = 'block';
};