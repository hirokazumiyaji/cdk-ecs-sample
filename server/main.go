package main

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
	e := echo.New()
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	e.GET("/health", func(c echo.Context) error {
		return c.String(http.StatusOK, "OK")
	})

	e.GET("/ping", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"message": "PONG"})
	})

	e.Logger.Fatal(e.Start(":3000"))
}
