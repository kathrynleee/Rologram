// store class data and role stereotype, and create relationship between class and role stereotype 
LOAD CSV WITH HEADERS FROM 'file:///classes.csv' AS row
MERGE (role:Role { name: row.role })
CREATE (class:Class { id: row.id, name: row.name, parent: row.parent, role: row.role, version: row.version, loc: toInteger(row.loc) })
CREATE (class)-[:HAS_ROLE]->(role)

// store package data
LOAD CSV WITH HEADERS FROM 'file:///packages.csv' AS row
CREATE (package:Package { id: row.id, name: row.name, parent: row.parent, version: row.version })

// create relationship between package and sub package
MATCH (a:Package), (b:Package)
WHERE EXISTS (a.parent) AND a.parent=b.id AND a.version=b.version
CREATE (a)-[:BELONGS_TO]->(b)

// create relationship between package and class
MATCH (class:Class), (package:Package)
WHERE class.parent=package.id AND class.version=package.version
CREATE (class)-[:BELONGS_TO]->(package)

// store dependency data
LOAD CSV WITH HEADERS FROM 'file:///dependencies.csv' AS row
CREATE (dependency:Dependency { source: row.source, target: row.target, version: row.version })

// create relationship between two classes with dependency
MATCH (a:Class), (b:Class), (dependency:Dependency)
WHERE dependency.source=a.id AND dependency.target=b.id AND a.version=b.version AND dependency.version=a.version
CREATE (a)-[:DEPENDS_ON]->(b)

// store path data
LOAD CSV WITH HEADERS FROM 'file:///path.csv' AS row
CREATE (path:Path { version: row.version, package: row.package, path: row.path, username: row.username })

// store path with specific version and package
MATCH (path: Path), (p: Package)
WHERE (path.version=p.version AND path.package=p.id)
CREATE (p)-[:IN_PATH]->(path)

// store path for packages without specific version
MATCH (path: Path), (p: Package)
WHERE (path.version IS NULL AND path.package=p.id)
AND NOT (p)-[:IN_PATH]->()
CREATE (p)-[:IN_PATH]->(path)

// store versions
MATCH (p:Package)
MERGE (version:Version { id: p.version, date: left(p.version, 10), commitId: right(p.version, 40) })