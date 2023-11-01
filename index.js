// package for inquirer prompts
const inquirer = require('inquirer');
// package for formatted tables
var easyTable = require('easy-table')
// package for terminal color manipulation
var colors = require('colors');

// import functions
const { user_choices, add_dept_prompts, add_role_prompts, add_emp_prompts, delete_dept_prompts } = require('./lib/prompts');


// connection to database
const db = require('./config/connection');
// const { getRolesFromDatabase } = require('./lib/dbqueries.js');

// test connection
db.connect((err) => {
    if (err) {
        console.log(`There was an error connecting to the database: `, err)
    } else {
        console.log(colors.green(`\nSuccessfully connected to database!\n`))
        begin();
    }
});


// function to display choices for user selection
function begin() {
    inquirer.prompt(user_choices)
    .then(response => {
        console.log(colors.yellow(`\nSelected: ${response.user_selection}`)); // remove later
        switch (response.user_selection) {
            case 'View All Employees':
                viewAllEmployees();
                break;
            case 'Add Employee':
                addEmployee();
                break;
            case 'Update Employee Role':
                updateEmployeeRole();
                break;
            case 'View All Roles':
                viewAllRoles();
                break;
            case 'Add Role':
                addRole();
                break;
            case 'View All Departments':
                viewAllDepartments();
                break;
            case 'Add Department':
                addDept();
                break;
            
            // bonus
            case 'Update Employee Manager':
                nonFunctioningChoice();
                break;
            case 'Update Employee Manager':
                nonFunctioningChoice();
                break;
            case 'View Employees By Manager':
                nonFunctioningChoice();
                break;
            case 'View Employees By Department':
                nonFunctioningChoice();
                break;
            case 'Delete Departments':
                deleteDept();
                break;
            case 'Delete Roles':
                nonFunctioningChoice();
                break;
            case 'Delete Employees':
                nonFunctioningChoice();
                break;
            case 'View Total Utilized Budget Of A Department':
                nonFunctioningChoice();
                break;

            case 'Quit':
                endConnection();
                break;

        }
    });
}

// for development, remove later
function nonFunctioningChoice () {
    console.log(colors.red(`Selection not yet functional.\n`))
    begin();
}

function viewAllEmployees() {
    const sql = `SELECT employees.id, 
                        CONCAT(employees.last_name, ', ', employees.first_name) AS name,
                        roles.title AS role, departments.name AS department, roles.salary,
                        CONCAT(managers.first_name, ' ', managers.last_name) AS manager
                 FROM employees
                 LEFT JOIN roles ON employees.role_id = roles.id
                 LEFT JOIN departments ON roles.department_id = departments.id
                 LEFT JOIN employees AS managers ON employees.manager_id = managers.id
                 ORDER BY employees.last_name, employees.first_name`;
    
    db.query(sql, (err, res) => {
        if (err) {
            console.log(`Error with selection: ${err}`)
            return begin();
        } else {
            console.log(colors.gray(`Viewing all employees in order by last name:`))
            // format table with easy-table
            const employeeTable = new easyTable();

            res.forEach(function(row) {
                employeeTable.cell(colors.magenta('ID'), row.id);
                employeeTable.cell(colors.magenta('Last, First'), row.name);
                employeeTable.cell(colors.magenta('Role'), row.role);
                employeeTable.cell(colors.magenta('Department'), row.department);
                employeeTable.cell(colors.magenta('Salary, USD'), row.salary);
                employeeTable.cell(colors.magenta('Manager'), row.manager || 'n/a');
                employeeTable.newRow();
            });

            // print table
            console.log(employeeTable.toString());
        }
        
        begin();
    });
}

function viewAllRoles () {
    const sql = `SELECT roles.id, roles.title
                 FROM roles
                 ORDER BY roles.title`;

    db.query(sql, (err, res) => {
        if (err) {
            console.log(`Error with selection: ${err}`)
            return begin();
        } else {
            console.log(colors.gray(`Viewing all roles by title:`))
            // format table with easy-table
            const roleTable = new easyTable();

            res.forEach(function(row) {
                roleTable.cell(colors.magenta('ID'), row.id);
                roleTable.cell(colors.magenta('Role Title'), row.title);
                roleTable.newRow();
            });

            // print table
            console.log(roleTable.toString());
        }
        
        begin();
    });
}

function viewAllDepartments () {
    const sql = `SELECT departments.id, departments.name
                 FROM departments
                 ORDER BY departments.name`;

    db.query(sql, (err, res) => {
        if (err) {
            console.log(`Error with selection: ${err}`)
            return begin();
        } else {
            console.log(colors.gray(`Viewing all departments by name:`))
            // format table with easy-table
            const departmentTable = new easyTable();

            res.forEach(function(row) {
                departmentTable.cell(colors.magenta('ID'), row.id);
                departmentTable.cell(colors.magenta('Department Name'), row.name);
                departmentTable.newRow();
            });

            // print table
            console.log(departmentTable.toString());
        }
        
        begin();
    });
}

async function addDept () {
    try {
        // collect user info regarding new dept name
        const response = await inquirer.prompt(add_dept_prompts);
        let newDeptName = response.new_department;

        // query departments from database
        const sql = `INSERT INTO departments (name) VALUES (?)`;
        db.query(sql, [newDeptName], (err, res) => {
            if (err) {
                console.log(colors.red(`Error adding new department: ${err}\n`));
                return begin();
            } else {
                console.log(colors.green(`Department has been added!`))
                viewAllDepartments();
            }
        });
    } catch (err) {
        console.log(colors.red(`${err}\n`));
        begin();
    }
}


async function addRole () {
    try {
        // collect user info regarding new role name and salary
        const response = await inquirer.prompt(add_role_prompts);
        let newRoleTitle = response.new_role_title; 
        let newRoleSalary = response.new_role_salary;
        
        // query departments from database
        const sql = `SELECT departments.id, departments.name
                        FROM departments
                        ORDER BY departments.name`;
        db.promise().query(sql)
        .then(([result]) => {
            // using result, form array with list of department choices
            const deptChoices = result.map(( { id, name } ) => ( {
                name: name,
                value: id,
            }
            ));
            
            // user prompt to collect info regarding new role dept
            inquirer.prompt([
                {
                    type: 'list',
                    message: "Select the department for the new role:",
                    name: 'new_role_department',
                    choices: deptChoices
                }
            ])
            .then((response) => {
                let newRoleDpt = response.new_role_department
                const sql = `INSERT INTO roles (title, salary, department_id) VALUES (?, ?, ?)`;
                // insert new role into the database
                db.query(sql, [newRoleTitle, newRoleSalary, newRoleDpt], (err, res) => {
                    // error handling
                    if (err) {
                        console.log(colors.red(`Error adding new role: ${err}\n`));
                        return begin();
                    // success log message and display all roles to show new role included
                    } else {
                        console.log(colors.green(`New role has been added: ${newRoleTitle}`))
                        viewAllRoles();
                    }
                });
            })
        })

    } catch (err) {
        console.log(colors.red(`${err}\n`));
        begin();
    }
}




async function addEmployee () {
    try {
        // collect user info regarding new role name and salary
        const response = await inquirer.prompt(add_emp_prompts);
        let newEmpFirst = response.new_emp_first; 
        let newEmpLast = response.new_emp_last;
        
        // query departments from database
        const sql = `SELECT roles.id, roles.title
                     FROM roles ORDER BY roles.title`;

        db.promise().query(sql)
        .then(([result]) => {
            // using result, form array with list of role choices
            const roleChoices = result.map(( { id, title } ) => 
                ({
                    name: title,
                    value: id,
                })
            );
       
            // user prompt to collect info regarding new emp's role
            inquirer.prompt([
                {
                    type: 'list',
                    message: "Select the role for the new employee: ",
                    name: 'new_emp_role',
                    choices: roleChoices
                }
            ])
            .then((response) => {
                let newEmpRole = response.new_emp_role;

                const sql = `SELECT employees.id, 
                             CONCAT(employees.last_name, ', ', employees.first_name, ' [ID: ', employees.id, ']') AS name
                             FROM employees ORDER BY employees.last_name`;

                db.promise().query(sql)
                .then(([result]) => {
                    // using result, form array with list of role choices
                    const managerChoices = result.map(( { id, name } ) => 
                        ({
                            name: name,
                            value: id,
                        })
                    );
                    // push an empty string into the array to provide a "null" choice in the prompt
                    managerChoices.push({
                        name: 'None',
                        value: null,
                    });
                    
                    inquirer.prompt([
                        {
                            type: 'list',
                            message: "Select the manager of the new employee: ",
                            name: 'new_emp_manager',
                            choices: managerChoices
                        }
                    ])
                    .then((response) => {
                        let newEmpManager = response.new_emp_manager;
                        const sql = `INSERT INTO employees (first_name, last_name, role_id, manager_id) 
                                     VALUES (?, ?, ?, ?)`;
                        
                        // insert new employee into the database
                        db.query(sql, [newEmpFirst, newEmpLast, newEmpRole, newEmpManager], (err, res) => {
                            // error handling
                            if (err) {
                                console.log(colors.red(`Error adding new employee: ${err}\n`));
                                return begin();
                            // success log message and display all employees to show new employee included
                            } else {
                                console.log(colors.green(`New role has been added: ${newEmpFirst} ${newEmpLast}`))
                                viewAllEmployees();
                            }
                        });
                    })
                })
            })
        })

    } catch (err) {
        console.log(colors.red(`${err}\n`));
        begin();
    }
}




async function updateEmployeeRole () {
    try {        
        // query departments from database
        const sql = `SELECT employees.id, 
                        CONCAT(employees.last_name, ', ', employees.first_name, 
                            ' [Role: ', roles.title, ']', ' [ID: ', employees.id, ']') AS name
                        FROM employees
                        INNER JOIN roles ON employees.role_id = roles.id
                        ORDER BY employees.last_name`;

        db.promise().query(sql)
        .then(([result]) => {
            // using result, form array with list of employees
            const employeeChoices = result.map(( { id, name } ) => 
                ({
                    name: name,
                    value: id,
                })
            );
       
            // user prompt to collect info regarding new emp's manager
            inquirer.prompt([
                {
                    type: 'list',
                    message: "Select the employee to update role:",
                    name: 'emp_to_update',
                    choices: employeeChoices
                }
            ])
            .then((response) => {
                let updatedEmp = response.emp_to_update;

                const sql = `SELECT roles.id, roles.title
                             FROM roles ORDER BY roles.title`;

                db.promise().query(sql)
                .then(([result]) => {
                    const roleChoices = result.map(( { id, title } ) => 
                        ({
                            name: title,
                            value: id,
                        })
                    ); 
                    inquirer.prompt([
                        {
                            type: 'list',
                            message: "Select the new role for the employee: ",
                            name: 'updated_emp_role',
                            choices: roleChoices
                        }
                    ])
                    .then((response) => {
                        let updatedEmpRole = response.updated_emp_role;

                        const sql = `UPDATE employees SET role_id = ? WHERE id = ?`;
                        db.query(sql, [updatedEmp, updatedEmpRole], (err, res) => {
                            // error handling
                            if (err) {
                                console.log(colors.red(`Error updating employee. ${err}\n`));
                                return begin();
                            // success log message and display all employees to show new employee included
                            } else {
                                console.log(colors.green(`Role has been updated.`))
                                viewAllEmployees();
                            }
                        })
                    })
                })
            })
        })

    } catch (err) {
        console.log(colors.red(`${err}\n`));
        begin();
    }
}



















// end connection and quit database
function endConnection () {
    db.end(function(err) {
        if (err) {console.log(`Error ending database connection: ${err}`);} 
        else {console.log(colors.red('Database connection ended.'));}
    });
}