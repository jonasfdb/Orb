// Orb - Utility to generate captcha images
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE

import { generate_captcha_string, generate_random_string } from "./generators";
import canvas from "@napi-rs/canvas";
import Discord from "discord.js";

export async function generate_captcha() {
  const captcha_image_canvas = canvas.createCanvas(400, 250);
  const captcha_image_context = captcha_image_canvas.getContext('2d');
  let bg_image;
  try {
    let animal_picker = () => {
      let animals = ['cat', 'fox', 'dog', 'panda', 'red_panda', 'racoon'];
      let animal = animals[Math.floor(Math.random() * animals.length)];
      return animal;
    }
    let response = await fetch(`https://api.some-random-api.com/animal/${animal_picker()}`);
    if(!response || !response.ok) {
      throw new Error(`Unable to perform fetch request.`)
    }

    bg_image = await response.json();
  } catch (error: any) {
    throw new Error(error);
  }
  const bg = await canvas.loadImage(bg_image.image);
  const solution = Array.from(generate_captcha_string(6).toUpperCase());
  const decoy = Array.from(generate_random_string(30).toUpperCase());

  console.log(solution)

  captcha_image_context.drawImage(bg, 0, 0, captcha_image_canvas.width, captcha_image_canvas.height);

  /*
  // average color rgb values
  let red = 0;
  let green = 0;
  let blue = 0;

  // opposite color rgb values
  let c_red = 0;
  let c_green = 0;
  let c_blue = 0;

  const bg_data = captcha_image_context.getImageData(0, 0, captcha_image_canvas.width, captcha_image_canvas.height).data;

  for (let i = 0; i < bg_data.length; i += 4) {
    red += bg_data[i];
    green += bg_data[i + 1];
    blue += bg_data[i + 2];
  }

  const total_pixels = bg_data.length / 4;

  red = Math.round(red / total_pixels);
  green = Math.round(green / total_pixels);
  blue = Math.round(blue / total_pixels);

  c_red = 255 - red;
  c_green = 255 - green;
  c_blue = 255 - blue;
  */

  // commented fillStyle and strokeStyle are for when using the background contrast color
  // code block commented out above is for calculating background contrast color, uncomment to calculate it

  captcha_image_context.globalAlpha = 1;  // 0.8 for gray decoy
  captcha_image_context.font = `50px Arial`;
  captcha_image_context.fillStyle = `rgb(86 213 149)`;
  // captcha_image_context.fillStyle = `rgb(${c_red}, ${c_green}, ${c_blue})`;
  captcha_image_context.textAlign = 'center';

  captcha_image_context.strokeStyle = `rgb(86 213 149)`;
  // captcha_image_context.strokeStyle = `rgb(${c_red}, ${c_green}, ${c_blue})`;
  captcha_image_context.lineWidth = 4;

  // place captcha letters and draw line
  let x_previous = 0;
  let y_previous = 0;
  let buffer = 40;
  let area_width = captcha_image_canvas.width / 6;  // divide captcha image into six sections (then later shift letters to the right based on section)
  let p_matrix = [
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0]
  ];

  /*
    let p_matrix = [
    [x_0, y_0],
    [x_1, y_1],
    [x_2, y_2],
    [x_3, y_3],
    [x_4, y_4],
    [x_5, y_5],
  ]
  */

  for (let i = 0; i < solution.length; i++) {
    if (i < 1) {
      // substract double the buffer from width/height so it generates away from top right, then add the buffer back to shift the letter from bottom left
      let x = Math.random() * (area_width - (buffer * 2)) + buffer;
      let y = Math.random() * (captcha_image_canvas.height - (buffer * 2)) + buffer;

      console.log(x, y, " - COORDINATES ", i)

      captcha_image_context.fillText(solution[i], x, y)

      x_previous = x;
      y_previous = y;

      p_matrix[i][0] = x;
      p_matrix[i][1] = y;

    } else {
      let clearance = false;
      let x = 0;
      let y = 0;
      let x_shift = area_width * i;

      do {
        x = Math.random() * (area_width - (buffer * 2)) + buffer + x_shift;
        y = Math.random() * (captcha_image_canvas.height - (buffer * 2)) + buffer;
        let clearance_check_passed_flag = true;

        for (let j = 0; j < i; j++) {
          let d = Math.sqrt(((x - p_matrix[j][0]) ** 2) + ((y - p_matrix[j][1]) ** 2))

          if (d < 40) {
            clearance_check_passed_flag = false;
          }
        }

        if (clearance_check_passed_flag === true) {
          clearance = true;
        }
      } while (!clearance);

      captcha_image_context.fillText(solution[i], x, y)

      console.log("FILLING LETTER ", solution[i], " AT ", x, y)

      captcha_image_context.globalAlpha = 0.6;
      captcha_image_context.beginPath();
      captcha_image_context.moveTo(x_previous, y_previous - 25);
      captcha_image_context.lineTo(x, y - 25);   // 50px letters means subtracting 25px from height will have the line start in the middle of the letter
      captcha_image_context.stroke();
      captcha_image_context.globalAlpha = 1;

      // remove this to have lines converge on first letter
      x_previous = x;
      y_previous = y;

      p_matrix[i][0] = x;
      p_matrix[i][1] = y;
    }
  }

  captcha_image_context.globalAlpha = 0.5;  // 0.8 for gray decoy
  captcha_image_context.font = `35px Arial`;
  captcha_image_context.fillStyle = `rgb(86 213 149)`;
  // captcha_image_context.fillStyle = `gray`;

  for (let i = 0; i < decoy.length; i++) {
    let x = Math.random() * (captcha_image_canvas.width - (buffer * 2)) + buffer;
    let y = Math.random() * (captcha_image_canvas.height - (buffer * 2)) + buffer;

    captcha_image_context.fillText(decoy[i], x, y)
  }

  return { file: new Discord.AttachmentBuilder(await captcha_image_canvas.encode('png'), { name: 'captcha.png' }), attachment: "attachment://captcha.png", solution: solution.join('') };
}
