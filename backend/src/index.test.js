const rewire = require("rewire")
const index = rewire("./index")
const socketIdsInRoom = index.__get__("socketIdsInRoom")
const findParticipant = index.__get__("findParticipant")
// @ponicode
describe("socketIdsInRoom", () => {
    test("0", () => {
        let callFunction = () => {
            socketIdsInRoom({ key1: "This is a Text" })
        }
    
        expect(callFunction).not.toThrow()
    })

    test("1", () => {
        let callFunction = () => {
            socketIdsInRoom({ key1: "Hello, world!" })
        }
    
        expect(callFunction).not.toThrow()
    })

    test("2", () => {
        let callFunction = () => {
            socketIdsInRoom({ key1: "foo bar" })
        }
    
        expect(callFunction).not.toThrow()
    })

    test("3", () => {
        let callFunction = () => {
            socketIdsInRoom({ key1: "Foo bar" })
        }
    
        expect(callFunction).not.toThrow()
    })

    test("4", () => {
        let callFunction = () => {
            socketIdsInRoom(undefined)
        }
    
        expect(callFunction).not.toThrow()
    })
})

// @ponicode
describe("findParticipant", () => {
    test("0", () => {
        let callFunction = () => {
            findParticipant("a85a8e6b-348b-4011-a1ec-1e78e9620782")
        }
    
        expect(callFunction).not.toThrow()
    })

    test("1", () => {
        let callFunction = () => {
            findParticipant("03ea49f8-1d96-4cd0-b279-0684e3eec3a9")
        }
    
        expect(callFunction).not.toThrow()
    })

    test("2", () => {
        let callFunction = () => {
            findParticipant("7289708e-b17a-477c-8a77-9ab575c4b4d8")
        }
    
        expect(callFunction).not.toThrow()
    })

    test("3", () => {
        let callFunction = () => {
            findParticipant(undefined)
        }
    
        expect(callFunction).not.toThrow()
    })
})
