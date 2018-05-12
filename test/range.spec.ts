import * as assert from "assert";
import { Range } from "../src";

describe("Range Tests", function () {
    describe("constructor", function () {
        const invalidOptionsTest = function (options: any, expectedError: any, done: any) {
            assert.throws(
                function () {
                    const r = new Range(options);
                },
                expectedError);
            done();
        };

        const optionsIsNullTest = function (options: any, done: any) {
            invalidOptionsTest(options, /Invalid argument: 'options' is null/, done);
        };

        const optionsIsNotAnObjectTest = function (options: any, done: any) {
            invalidOptionsTest(options, /Invalid argument: 'options' is not an object/, done);
        };

        const invalidRangeTest = function (options: any, done: any) {
            invalidOptionsTest(options,
                /Invalid argument: 'options.low' must be less than or equal than 'options.high'/, done);
        };

        it("options - undefined (ommited argument)", function (done) {
            assert(new Range());
            done();
        });

        it("options - undefined (literal argument)", function (done) {
            assert(new Range(undefined));
            done();
        });

        it("options - null ", function (done) {
            const options: any = null;
            optionsIsNullTest(options, done);
        });

        it("options - number", function (done) {
            const options = 0;
            optionsIsNotAnObjectTest(options, done);
        });

        it("invalid options - string", function (done) {
            const options = "";
            optionsIsNotAnObjectTest(options, done);
        });

        it("invalid options - boolean", function (done) {
            const options = false;
            optionsIsNotAnObjectTest(options, done);
        });

        it("Range instances are frozen", function (done) {
            const r = new Range();

            assert.throws(
                function () {
                    (r as any).compareFunction = 1;
                },
                /Can't add property compareFunction, object is not extensible/,
            );

            done();
        });
    });

    describe("_contains", function () {
        it("undefined,undefined contains undefined is true", function (done) {
            const r = new Range();
            assert(r._contains(undefined));
            done();
        });

        it("undefined,undefined contains null is false", function (done) {
            const r = new Range();
            assert(!r._contains(null));
            done();
        });

        it("null,null contains undefined is true", function (done) {
            const r = new Range({ low: null });
            assert(r._contains(null));
            done();
        });

        it("null,null contains null is true", function (done) {
            const r = new Range({ low: null });
            assert(r._contains(null));
            done();
        });

        it("range contains self is true - default range", function (done) {
            const r = new Range();
            assert(r._contains(r));
            done();
        });

        it("range contains self is true - non-default range", function (done) {
            const r = new Range({ low: "A" });
            assert(r._contains(r));
            done();
        });

        it("A,D contains B,C is true", function (done) {
            const r1 = new Range({ low: "A", high: "D" });
            const r2 = new Range({ low: "B", high: "C" });
            assert(r1._contains(r2));
            done();
        });

        it("B,C contains A,D is false", function (done) {
            const r1 = new Range({ low: "B", high: "C" });
            const r2 = new Range({ low: "A", high: "D" });
            assert(!r1._contains(r2));
            done();
        });

        it("A,C contains B,D is false", function (done) {
            const r1 = new Range({ low: "A", high: "C" });
            const r2 = new Range({ low: "B", high: "D" });
            assert(!r1._contains(r2));
            done();
        });

        it("B,D contains A,C is false", function (done) {
            const r1 = new Range({ low: "B", high: "D" });
            const r2 = new Range({ low: "A", high: "C" });
            assert(!r1._contains(r2));
            done();
        });

        it("A,B contains B,C is false", function (done) {
            const r1 = new Range({ low: "A", high: "B" });
            const r2 = new Range({ low: "B", high: "C" });
            assert(!r1._contains(r2));
            done();
        });

        it("B,C contains A,B is false", function (done) {
            const r1 = new Range({ low: "B", high: "C" });
            const r2 = new Range({ low: "A", high: "B" });
            assert(!r1._contains(r2));
            done();
        });

        it("A,B contains C,D is false", function (done) {
            const r1 = new Range({ low: "A", high: "B" });
            const r2 = new Range({ low: "C", high: "D" });
            assert(!r1._contains(r2));
            done();
        });

        it("C,D contains A,B is false", function (done) {
            const r1 = new Range({ low: "C", high: "D" });
            const r2 = new Range({ low: "A", high: "B" });
            assert(!r1._contains(r2));
            done();
        });

        it("A,C contains B is true", function (done) {
            const r1 = new Range({ low: "A", high: "C" });
            assert(r1._contains("B"));
            done();
        });

        it("B,C contains A is false", function (done) {
            const r1 = new Range({ low: "B", high: "C" });
            assert(!r1._contains("A"));
            done();
        });

        it("A,B contains C is false", function (done) {
            const r1 = new Range({ low: "A", high: "B" });
            assert(!r1._contains("C"));
            done();
        });
    });

    describe("_containsPoint", function () {
        const range = new Range({ low: 1, high: 3 });

        it("numbers, default comparison", function (done) {
            assert(range._containsPoint(20));
            done();
        });

        it("numbers, custom comparison", function (done) {

            assert(!range._containsPoint(20, function (a, b) {
                return a > b ? 1 : -1;
            }));

            done();
        });
    });

    describe("_containsRange", function () {
        const range = new Range({ low: 1, high: 3 });

        it("numbers, default comparison", function (done) {
            assert(range._containsRange(new Range({ low: 20, high: 29 })));
            done();
        });

        it("numbers, custom comparison", function (done) {
            assert(!range._containsRange(new Range({ low: 20, high: 29 }), function (a, b) {
                return a > b ? 1 : -1;
            }));

            done();
        });
    });

    describe("_intersect", function () {
        const otherIsUndefinedOrNullTest = function (other: any, done: any) {
            const r = new Range();
            assert.throws(
                function () {
                    r._intersect(other);
                },
                /Invalid Argument: 'other' is undefined or null/,
            );
            done();
        };

        it("error - other is undefined", function (done) {
            otherIsUndefinedOrNullTest(undefined, done);
        });

        it("error - other is null", function (done) {
            otherIsUndefinedOrNullTest(null, done);
        });

        it("range intersect self is true - default range", function (done) {
            const r = new Range();
            assert(r._intersect(r));
            done();
        });

        it("R intersect R is true - non default range", function (done) {
            const r = new Range({ low: 1, high: "2" });
            assert(r._intersect(r));
            done();
        });

        it("A,D insersects B,C is true", function (done) {
            const r1 = new Range({ low: "A", high: "D" });
            const r2 = new Range({ low: "B", high: "C" });
            assert(r1._intersect(r2));
            done();
        });

        it("B,C insersects A,D is true", function (done) {
            const r1 = new Range({ low: "B", high: "C" });
            const r2 = new Range({ low: "A", high: "D" });
            assert(r1._intersect(r2));
            done();
        });

        it("A,C insersects B,D is true", function (done) {
            const r1 = new Range({ low: "A", high: "C" });
            const r2 = new Range({ low: "B", high: "D" });
            assert(r1._intersect(r2));
            assert(r2._intersect(r1));
            done();
        });

        it("B,D insersects A,C is true", function (done) {
            const r1 = new Range({ low: "B", high: "D" });
            const r2 = new Range({ low: "A", high: "C" });
            assert(r1._intersect(r2));
            done();
        });

        it("A,B insersects B,C is true", function (done) {
            const r1 = new Range({ low: "A", high: "B" });
            const r2 = new Range({ low: "B", high: "C" });
            assert(r1._intersect(r2));
            assert(r2._intersect(r1));
            done();
        });

        it("B,C insersects A,B is true", function (done) {
            const r1 = new Range({ low: "B", high: "C" });
            const r2 = new Range({ low: "A", high: "B" });
            assert(r1._intersect(r2));
            done();
        });

        it("A,B insersects C,D is false", function (done) {
            const r1 = new Range({ low: "A", high: "B" });
            const r2 = new Range({ low: "C", high: "D" });
            assert(!r1._intersect(r2));
            done();
        });

        it("C,D insersects A,B is false", function (done) {
            const r1 = new Range({ low: "C", high: "D" });
            const r2 = new Range({ low: "A", high: "B" });
            assert(!r1._intersect(r2));
            done();
        });
    });

    describe("_toString", function () {
        const toStringTest = function (options: any, expectedString: any, done: any) {
            const r = new Range(options);
            assert.strictEqual(r._toString(), expectedString);
            done();
        };

        it("undefined values", function (done) {
            toStringTest(undefined, "undefined,undefined", done);
        });
        it("null values", function (done) {
            toStringTest({ low: null }, "null,null", done);
        });
        it("NaN values", function (done) {
            toStringTest({ low: NaN }, "NaN,NaN", done);
        });
        it("number values", function (done) {
            toStringTest({ low: 1 }, "1,1", done);
        });
        it("string values", function (done) {
            toStringTest({ low: "a" }, "a,a", done);
        });
        it("boolean values", function (done) {
            toStringTest({ low: false, high: true }, "false,true", done);
        });
        it("object values", function (done) {
            toStringTest({ low: {} }, "[object Object],[object Object]", done);
        });
    });

    describe("_compare", function () {
        const r = new Range();

        const compareAsNumbers = function (a: any, b: any) {
            return a - b;
        };

        const constantCompareFunction = function (a: any, b: any) {
            return 0;
        };

        it("(undefined, undefined) === 0", function (done) {
            // assert(r._compare() === 0);
            // assert(r._compare(undefined) === 0);
            assert(r._compare(undefined, undefined) === 0);
            done();
        });

        it("(undefined, y) > 0", function (done) {
            assert(r._compare(undefined, null) > 0);
            assert(r._compare(undefined, -NaN) > 0);
            assert(r._compare(undefined, 0) > 0);
            assert(r._compare(undefined, NaN) > 0);
            assert(r._compare(undefined, true as any) > 0);
            assert(r._compare(undefined, false as any) > 0);
            assert(r._compare(undefined, "a") > 0);
            assert(r._compare(undefined, "undefined") > 0);
            assert(r._compare(undefined, "z") > 0);
            assert(r._compare(undefined, [] as any) > 0);
            assert(r._compare(undefined, {} as any) > 0);
            assert(r._compare(undefined, 2, constantCompareFunction) > 0);
            assert(r._compare(undefined, 2, compareAsNumbers) > 0);

            done();
        });

        it("(x, undefined) < 0", function (done) {
            assert(r._compare(null, undefined) < 0);
            assert(r._compare(-NaN, undefined) < 0);
            assert(r._compare(0, undefined) < 0);
            assert(r._compare(NaN, undefined) < 0);
            assert(r._compare(true as any, undefined) < 0);
            assert(r._compare(false as any, undefined) < 0);
            assert(r._compare("a", undefined) < 0);
            assert(r._compare("undefined", undefined) < 0);
            assert(r._compare("z", undefined) < 0);
            assert(r._compare([] as any, undefined) < 0);
            assert(r._compare({} as any, undefined) < 0);
            assert(r._compare(1, undefined, constantCompareFunction) < 0);
            assert(r._compare(1, undefined, compareAsNumbers) < 0);
            done();
        });

        it("values as strings (default)", function (done) {
            assert(r._compare("A", "B") < 0);
            assert(r._compare("", "") === 0);
            assert(r._compare("B", "A") > 0);
            assert(r._compare("10", "2") < 0);
            assert(r._compare(10, "02") > 0);
            assert(r._compare(10, 2) < 0);
            assert(r._compare(null, "nulm") < 0);
            assert(r._compare(null, "null") === 0);
            assert(r._compare(null, "nulk") > 0);
            assert(r._compare(true as any, "truf") < 0);
            assert(r._compare(true as any, "true") === 0);
            assert(r._compare(true as any, "trud") > 0);
            assert(r._compare({} as any, "[object Object]") === 0);
            done();
        });

        it("values as numbers", function (done) {

            assert(r._compare(undefined, 2, compareAsNumbers) > 0);
            assert(r._compare(1, 2, compareAsNumbers) < 0);
            assert(r._compare(0, 0, compareAsNumbers) === 0);
            assert(r._compare(10, 2, compareAsNumbers) > 0);
            done();
        });

        it("always return 0", function (done) {
            assert(r._compare(1, 2, constantCompareFunction) === 0);
            assert(r._compare(2, 1, constantCompareFunction) === 0);
            done();
        });
    });

    describe("_isRange", function () {
        it("_isRange(undefined) is false", function (done) {
            assert(!Range._isRange(undefined));
            done();
        });

        it("_isRange(null) is false", function (done) {
            assert(!Range._isRange(null));
            done();
        });

        it("_isRange(non-object) is false", function (done) {
            const points: any[] = [
                undefined,
                null,
                1,
                "",
                true,
                NaN,
                function () { /* no op */ },
                {},
                {
                    low: "",
                },
            ];

            for (const point of points) {
                assert(!Range._isRange(point));
            }

            done();
        });

        it("_isRange(point) is false", function (done) {
            const ranges: any[] = [
                {
                    low: "",
                    high: 1,
                },
                // new Range(), // TODO: this was here, but _isRange just tests for if it's instanceof
            ];

            for (const range of ranges) {
                assert(!Range._isRange(range));
            }

            done();
        });
    });
});
