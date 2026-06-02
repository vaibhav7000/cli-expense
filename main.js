console.log("Hello")

const newPromise = new Promise((done, err) => {
    console.log(`1`)
})

newPromise.then(data => {
    console.log(data)
})

console.log("end");