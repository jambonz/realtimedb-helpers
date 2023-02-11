#!/bin/sh

mkdir -p stubs/nuance

for FILE in ./protos/nuance/*; do 
  grpc_tools_node_protoc   \
  --js_out=import_style=commonjs,binary:./stubs/nuance \
  --grpc_out=grpc_js:./stubs/nuance \
  --proto_path=./protos/nuance  \
  $FILE
done

mkdir -p stubs/riva

for FILE in ./protos/riva/proto/*; do 
  grpc_tools_node_protoc   \
  --js_out=import_style=commonjs,binary:./stubs \
  --grpc_out=grpc_js:./stubs \
  --proto_path=./protos  \
  $FILE
done
