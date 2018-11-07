//lines to touch each week to add the new week:
  //new CSV for parsing
  //line 68, line 138, line 170   //this time, only change the ending date on 138!
  //new report
  //erase github secret
  //push to gitlab

const fetch = require('node-fetch');
const Moment = require('moment');
const {extendMoment} = require('moment-range');
const moment = extendMoment(Moment);
const parse = require('parse-link-header');
let arrayOfIdObjects = []; //LDAP plus GitHub Id

//get CSV from sheets using the terminal

//parse CSV into JSON using module (look at old code)
let {Parser} = require('parse-csv');
let parser = new Parser();
let encoding = 'utf-8';
let csvData = "";

process.stdin.setEncoding(encoding);
process.stdin.on('readable', () => {
  let chunk;
  while (chunk = process.stdin.read()) {
    csvData += chunk;
  }
})
process.stdin.on('end', () => {
  var datagrid = parser.parse(csvData).data;

  changeHeader(datagrid[0]);
  writeChangedHeaderToCSV(datagrid);

  let arrayOfGithubIds = [];
  //detect duplicates, add user events, and send the the csv to stdout
  for(let i=1; i<datagrid.length; i++) {
    let currentRow = datagrid[i];
    let duplicateGithubId = false;
    for(let i=0; i<arrayOfGithubIds.length; i++) {
      if(arrayOfGithubIds[i]===currentRow[1]) {
        console.log("Duplicate GitHub ID- Erase From Google Sheet:", currentRow[1]);
        duplicateGithubId=true
        break;
      }
    }
    if(duplicateGithubId===true) {
      continue;
    }
    arrayOfGithubIds.push(currentRow[1]);
    let LDAP = parseLDAPfromEmail(currentRow);
    //if(currentRow[1]==="rohankapoorcom") {
    fetchUserDataAndAddToCSV(currentRow, LDAP);
    //}
  }
});

//Helper Functions

function changeHeader(headerRow) {
  //this is just hard-coded. Could change that later to programmatically add dates, if desired
  headerRow[0] = "Github ID - LDAP";
  headerRow[1] = "09/08/2018";
  headerRow[2] = "09/15/2018";
  headerRow[3] = "09/22/2018";
  headerRow[4] = "09/29/2018";
  headerRow[5] = "10/06/2018";
  headerRow[6] = "10/13/2018";
  headerRow[7] = "10/20/2018";
  headerRow[8] = "10/27/2018";
}

function writeChangedHeaderToCSV(datagrid) {
  datagrid[0].forEach((element) => {
    if(datagrid[0].indexOf(element) === datagrid[0].length-1) {
      process.stdout.write(element + '\n');
    } else {
      process.stdout.write(element + ',');
    }
  })
}


function parseLDAPfromEmail(row) {
  return row[4].slice(0, row[4].indexOf("@"))
}

function fetchUserDataAndAddToCSV(row, LDAP) {
  //if you reach the API daily limit, you can make an oath app in github and add the client_id and client_secret to the end of the url like this:
  //`https://api.github.com/users/${row[1]}/events?client_id={put the id here}&client_secret={put the id here}`
  let url = `https://api.github.com/users/${row[1]}/events`
  fetchPageOfDataAndFilter(url).then(importantEvents => {
    let idObject = {};
    createIdObjects(row, LDAP, idObject, importantEvents);
    filterEventsByWeek(idObject)
    addWeeklyContributions(row, idObject)
    turnJSONIntoCSV(row)
  })
}

function fetchPageOfDataAndFilter(url) {
  return new Promise((resolve, reject) => {
    fetch(url)
    .then(response => {
      let parsed = parse(response.headers.get('link'));
      let importantEvents = [];
      response.json()
      .then(json => {
        filterResponseForImportantEvents(json, importantEvents);
        if (parsed && parsed.next && parsed.next.url) {
          fetchPageOfDataAndFilter(parsed.next.url).then(newEvents => {
            return resolve(importantEvents.concat(newEvents));
          });
        } else {
          return resolve(importantEvents);
        }
      })
      .catch(err => {console.log("ERROR GRABBING INFO FROM GITHUB!:", err);})
    });
  });
}

function filterResponseForImportantEvents(allEventsFromFetch, arrayOfImportantEvents) {
  for(let i=0; i<allEventsFromFetch.length; i++) {
    let event = allEventsFromFetch[i];
    switch(event.type) {
      case 'CommitCommentEvent':
      case 'IssueCommentEvent':
      case 'IssuesEvent':
      case 'PullRequestEvent':
      case 'PullRequestReviewEvent':
      case 'PullRequestReviewCommentEvent':
        arrayOfImportantEvents.push(event);
        break;
    }
  }
}

function createIdObjects(row, LDAP, idObject, importantEvents) {
  idObject.LDAP = LDAP;
  idObject.github = row[1];
  idObject.contributions = importantEvents;
  arrayOfIdObjects.push(idObject)
}

function filterEventsByWeek(idObject) {
  let weeklyRanges = [];
  const September8 = [moment('2018-09-02', 'YYYY-MM-DD'), moment('2018-09-09', 'YYYY-MM-DD')];
  weeklyRanges.push({September8: moment.range(September8)})
  const September15 = [moment('2018-09-09', 'YYYY-MM-DD'), moment('2018-09-16', 'YYYY-MM-DD')];
  weeklyRanges.push({September15: moment.range(September15)})
  const September22 = [moment('2018-09-16', 'YYYY-MM-DD'), moment('2018-09-23', 'YYYY-MM-DD')];
  weeklyRanges.push({September22: moment.range(September22)})
  const September29 = [moment('2018-09-23', 'YYYY-MM-DD'), moment('2018-09-30', 'YYYY-MM-DD')];
  weeklyRanges.push({September29: moment.range(September29)})
  const October6 = [moment('2018-09-30', 'YYYY-MM-DD'), moment('2018-10-07', 'YYYY-MM-DD')];
  weeklyRanges.push({October6: moment.range(October6)})
  const October13 = [moment('2018-10-07', 'YYYY-MM-DD'), moment('2018-10-14', 'YYYY-MM-DD')];
  weeklyRanges.push({October13: moment.range(October13)})
  const October20 = [moment('2018-10-14', 'YYYY-MM-DD'), moment('2018-10-21', 'YYYY-MM-DD')];
  weeklyRanges.push({October20: moment.range(October20)})
  const October27 = [moment('2018-10-21', 'YYYY-MM-DD'), moment('2018-10-28', 'YYYY-MM-DD')];
  weeklyRanges.push({October27: moment.range(October27)})

//there's definitely a more performant way to do this, but I don't care right now:
  const weeklyContributions = [];
  for(let i=0; i<weeklyRanges.length; i++) {
    let thisWeeksContribs = []
    for(var key in weeklyRanges[i]) {
      let range = weeklyRanges[i][key]
      //loop through this user's filtered contributions
      for(let i=0; i<idObject.contributions.length; i++) {
        let contribDate = moment(idObject.contributions[i].created_at, "YYYY-MM-DD, h:mm:ss a")
        if(range.contains(contribDate)) {
          thisWeeksContribs.push(idObject.contributions[i])
        }
      }
      let newObj = {[key]: thisWeeksContribs.length}
      weeklyContributions.push(newObj);
    }
  }
  idObject.numContributionsByWeek = weeklyContributions
}

function addWeeklyContributions(row, idObject) {
  row[0] = `${idObject.github} - ${idObject.LDAP}`;
  //the dates on these rows are hardcoded to save time, but I could do it with the code using their keys
  row[1] = idObject.numContributionsByWeek[0].September8.toString();
  row[2] = idObject.numContributionsByWeek[1].September15.toString();
  row[3] = idObject.numContributionsByWeek[2].September22.toString();
  row[4] = idObject.numContributionsByWeek[3].September29.toString();
  row[5] = idObject.numContributionsByWeek[4].October6.toString();
  row[6] = idObject.numContributionsByWeek[5].October13.toString();
  row[7] = idObject.numContributionsByWeek[6].October20.toString();
  row[8] = idObject.numContributionsByWeek[7].October27.toString();

}

function turnJSONIntoCSV(row) {
  //send the changed csv to stdout
  for(let i=0; i<row.length; i++) {
    if(row[i].includes(",")) {
      process.stdout.write('"' + row[i] + '"')
    } else {
      process.stdout.write(row[i])
      if(i !== row.length-1) {process.stdout.write(',')}
    }
  }
  process.stdout.write("\n");
}

//Possible Improvements To This Project:
//can look into using a If-Modified-Since header if I want https://developer.github.com/v3/#rate-limiting
//test that all events I expect get through the filter and none of the events I don't expect