# GithubAPIPaginator

### This is a tool to
- parse a CSV of Indeed employee GitHub Ids
- use those Ids to get each employee's GitHub contributions, using the GitHub REST API, and doing some filtering
- make a new CSV with each employee's GitHub Id, LDAP, and GitHub contributions bucketed by week  

#### To run:

in your terminal, type `cat {path/to/CSV/file} | node index.js`