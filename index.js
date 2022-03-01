const { Pool } = require('pg');
const Cursor = require('pg-cursor');

//LINEA DE COMANDOS
const cmd = process.argv.slice(2);

const config = {
	user: 'postgres',
	host: 'localhost',
	password: 'postgres',
	database: 'banco',
	port: 5433,
};
const pool = new Pool(config);

//TRANSACCION
if (cmd[0] == 'transaccion') {
	async function transaccion(descripcion, fecha, monto, cuenta) {
		pool.connect(async (error_conexion, client, release) => {
			if (error_conexion) return console.log(error_conexion);
			if (cmd[1] == 'acreditar') {
				// ASIGNAR FONDO
				try {
					await client.query('BEGIN');
					const acreditar = `UPDATE cuentas SET saldo = saldo + ${monto} WHERE id = ${cuenta} ;`;
					await client.query(acreditar);
					//
					const insertar = `
                    INSERT INTO transacciones 
                    (descripcion, fecha, monto, cuenta) 
                    VALUES (
                        '${descripcion}', 
                        '${fecha}', 
                        ${monto}, 
                        ${cuenta}) 
                        RETURNING *;
                        `;
					const nuevaTransaccion = await client.query(insertar);
					console.log('Nueva transacción realizada con exito:', nuevaTransaccion.rows[0]);
					await client.query('COMMIT');
				} catch (e) {
					await client.query('ROLLBACK');
					console.log(`Código de error:${error.code}`);
					console.log(`Detalle del error: ${error.detail}`);
					console.log(`Tabla originaria del error:${error.table}`);
					console.log(`Restricción  violada en el campo: ${error.constraint}`);
				}
			}
			if (cmd[1] == 'descontar') {
				// DESCONTAR FONDO
				try {
					await client.query('BEGIN');
					const descontar = `UPDATE cuentas SET saldo = saldo - ${monto} WHERE id = ${cuenta} ;`;
					await client.query(descontar);
					//
					const insertar = `
                        INSERT INTO transacciones 
                        (descripcion, fecha, monto, cuenta) 
                        VALUES (
                                                        '${descripcion}', 
                                                        '${fecha}', 
                                                        ${monto}, 
                                                        ${cuenta}
                                                        ) RETURNING *;
                                                        `;
					const nuevaTransaccion = await client.query(insertar);
					console.log('Nueva transacción realizada con exito:', nuevaTransaccion.rows[0]);
					await client.query('COMMIT');
				} catch (e) {
					await client.query('ROLLBACK');
					console.log(`Código de error:${error.code}`);
					console.log(`Detalle del error: ${error.detail}`);
					console.log(`Tabla originaria del error:${error.table}`);
					console.log(`Restricción  violada en el campo: ${error.constraint}`);
				}
			}
			release();
			pool.end();
		});
	}
	transaccion(cmd[1], cmd[2], cmd[3], cmd[4]);
}

//CONSULTA TRANSACCION
if (cmd[0] == 'consultaTransaccion') {
	async function saldo(cuenta) {
		pool.connect(async (error_conexion, client, release) => {
			if (error_conexion) return console.log(error_conexion);
			const consulta = new Cursor(`SELECT * FROM transacciones WHERE cuenta = ${cuenta}`);
			const cursor = client.query(consulta);
			//READ
			cursor.read(10, (error, rows) => {
				if (error) return console.log(error);
				console.log(rows);
				cursor.close();
				release();
				pool.end();
			});
		});
	}
	saldo(cmd[1]);
}
//CONSULTA CUENTA
if (cmd[0] == 'consultaCuenta') {
	async function saldo(cuenta) {
		pool.connect(async (error_conexion, client, release) => {
			if (error_conexion) return console.log(error_conexion);
			const consulta = new Cursor(`SELECT * FROM cuentas WHERE id = ${cuenta}`);
			const cursor = client.query(consulta);
			//READ
			cursor.read(1, (error, rows) => {
				if (error) return console.log(error);
				console.log(rows);
				cursor.close();
				release();
				pool.end();
			});
		});
	}
	saldo(cmd[1]);
}
