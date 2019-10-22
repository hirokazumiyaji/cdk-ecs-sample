FROM golang:1.13-alpine as builder

WORKDIR /go/src/github.com/hirokazumiyaji/cdk-ecs-sample/server

COPY go.mod go.sum ./

RUN go mod download

COPY main.go ./

RUN go build -o application

FROM alpine:latest

RUN apk update && \
    apk --no-cache add ca-certificates tzdata && \
    cp /usr/share/zoneinfo/Asia/Tokyo /etc/localtime && \
    rm -rf /var/cache/apk/*

COPY --from=builder /go/src/github.com/hirokazumiyaji/cdk-ecs-sample/server/application /usr/local/bin/application

EXPOSE 3000

CMD ["/usr/local/bin/application"]
