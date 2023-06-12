![build](https://github.com/transcriptaze/snyth-js/workflows/build/badge.svg)

# snyth-js

In-browser Javascript implementation of the _snyth_ experimental additive synthesiser that use Jacobi
ellipses as the generator function. For a detailed description, user guide and examples, please see the
parent repository [README](https://github.com/transcriptaze/snyth).

## Development

The CORS requirements of current browsers require that the HTML and Javascript files be served by an 
HTTP server that sets the correct headers in the request response. _snyth_ includes two ways to run
a suitable HTTP server:

1. This repository includes a Python [script](https://github.com/transcriptaze/snyth-js/httpd.py) that 
   runs the built-in Python HTTP server with CORS support. To run it:
```
python3 httpd.py
```
(or)
```
python3 -m http.server 9000 --directory ./html
```

2. The [snythd](https://github.com/transcriptaze/snythd) folder in the parent repository includes an 
   executable HTTP server that can be run locally for development. In the _snythd_ folder, run:
```
go build -mod readonly --trimpath -o bin ./...
./bin/snythd --debug --html ../snyth-js/html
```

Or, alternatively, if you have _make_ installed, in the _snythd_ folder:
```
make debug
```


## Issues and Feature Requests

For bug reports and other issues please create an issue in [this](https://github.com/transcriptaze/snyth-js) _github_
repository. Feature requests should preferably be created as issues in the [snyth](https://github.com/transcriptaze/snyth)
parent repository.

Pull requests and other contributions are welcome but the code in this repository is currently being rearchitured and
changing almost daily, so please submit any pull requests against the _experimental_ branch (which ironically is likely
to be more stable than the _main_ branch, at least for the immediate future).


## License

[GPL-3.0](https://github.com/transcriptaze/snyth-js/blob/master/LICENSE)

