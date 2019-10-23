package main

import (
	"database/sql"
	"net/http"
	"os"

	_ "github.com/go-sql-driver/mysql"

	echo "github.com/labstack/echo/v4"
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

	e.GET("/tables", func(c echo.Context) error {
		db, err := sql.Open("mysql", os.Getenv("DATABASE_URL"))
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		defer db.Close()

		rows, err := db.Query("SHOW TABLES")
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		defer rows.Close()

		tables := make([]string, 0)
		for rows.Next() {
			t := ""
			err := rows.Scan(&t)
			if err != nil {
				return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
			}
			tables = append(tables, t)
		}

		return c.JSON(http.StatusOK, tables)
	})

	e.Logger.Fatal(e.Start(":3000"))
}
