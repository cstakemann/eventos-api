<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

# Eventos-api

1. Clonar proyecto
2. Ejecutar comando `npm install`
3. Clonar el archivo `.env.template` y renombrarlo a `.env`
4. Cambiar las variables de entorno
5. Levantar la base de datos
```
docker-compose up -d
```

6. Ejecutar: 
```
npm run start:dev
```

7. Realizar build con Docker: 
```
docker-compose -f docker-compose.prod.yaml up -d
```

8. Detener build con Docker: 
```
docker-compose -f docker-compose.prod.yaml down
```

## Stack utilizado
* NestJs
* PostgreSQL