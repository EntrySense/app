let currentForm = 1

document.getElementById("formSwitcher").addEventListener("click", function (e) {
    let form =
    `
        <div>
            <p>Email Address</p>
            <input type="text" />
        </div>
        <div>
            <p>Password</p>
            <input type="password" />
        </div>
    `

    e.preventDefault()

    if (currentForm === 1) {
        currentForm = 2
        form = `<div><p>Full Name</p><input type="text" /></div>` + form + `<div><p>Confirm Password</p><input type="password" /></div>`

        document.getElementById("authCard").style.height = "1000px"
        document.getElementById("authForm").style.height = "550px"
        document.getElementById("authForm").innerHTML = form

        document.getElementById("prompt").textContent = "Create Account"
        document.getElementById("actionButton").value = "Create Account"
        document.getElementById("formSwitchPrompt").textContent = "Already have an account?"
        document.getElementById("formSwitcher").textContent = "Sign in"
    }
    else {
        currentForm = 1
        document.getElementById("authCard").style.height = "750px"
        document.getElementById("prompt").textContent = "Welcome Back"
        document.getElementById("authForm").style.height = "300px"
        document.getElementById("authForm").innerHTML = form
        document.getElementById("actionButton").value = "Sign In"
        document.getElementById("formSwitchPrompt").textContent = "Do not have an account?"
        document.getElementById("formSwitcher").textContent = "Sign up"
    }
})
