#include "wokwi-api.h"
#include <stdio.h>
#include <stdlib.h>

typedef struct {
  uint32_t lux_attr;
  uint8_t buffer[2];
  uint8_t byte_idx;
} chip_state_t;

static bool on_i2c_connect(void *user_data, uint32_t address, bool connect) {
  chip_state_t *chip = (chip_state_t *)user_data;
  chip->byte_idx = 0;
  return true; // ACK address 0x23
}

static uint8_t on_i2c_read(void *user_data) {
  chip_state_t *chip = (chip_state_t *)user_data;
  uint32_t lux = attr_read(chip->lux_attr);
  // BH1750 rumus output raw data: lux * 1.2
  uint16_t raw = (uint16_t)(lux * 1.2);
  chip->buffer[0] = (raw >> 8) & 0xFF;
  chip->buffer[1] = raw & 0xFF;

  uint8_t val = chip->buffer[chip->byte_idx];
  chip->byte_idx = (chip->byte_idx + 1) % 2;
  return val;
}

static bool on_i2c_write(void *user_data, uint8_t data) {
  return true; // ACK semua command
}

void chip_init() {
  chip_state_t *chip = malloc(sizeof(chip_state_t));
  chip->lux_attr = attr_init("lux", 450);
  chip->byte_idx = 0;

  const i2c_config_t i2c_config = {
    .user_data = chip,
    .address = 0x23,
    .scl = pin_init("SCL", INPUT),
    .sda = pin_init("SDA", INPUT),
    .connect = on_i2c_connect,
    .read = on_i2c_read,
    .write = on_i2c_write,
  };
  i2c_init(&i2c_config);
}
