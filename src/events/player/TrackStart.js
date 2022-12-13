import Event from "../../structures/Event.js";
import Dispatcher from "../../structures/Dispatcher.js";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
export default class TrackStart extends Event {
    constructor(...args) {
        super(...args, {
        });
    }
    /**
     * 
     * @param {import('shoukaku').Player} player 
     * @param {import('shoukaku').Track} track 
     * @param {import('discord.js').TextChannel} channel 
     * @param {import('shoukaku').Track[]} matchedTracks 
     * @param {Dispatcher} dispatcher 
     */
    async run(player, track, channel, matchedTracks, dispatcher) {

        const button = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('previous').setLabel('Previous').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('resume').setLabel(player.paused ? 'Resume' : 'Pause').setStyle(player.paused ? ButtonStyle.Success : ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('stop').setLabel('Stop').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('skip').setLabel('Skip').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('loop').setLabel('Loop').setStyle(ButtonStyle.Secondary),
        );
        const embed = this.client.embed().setTitle('Now Playing')
            .setDescription(`[${track.info.title}](${track.info.uri})`)
            .setThumbnail(dispatcher.displayThumbnail(track.info.ur))
            .setFooter({ text: `Requested by ${dispatcher.requester.tag}`, iconURL: dispatcher.requester.avatarURL({ dynamic: true }) })
            .setColor(this.client.color.default)
        const message = await channel.send({ embeds: [embed], components: [button] });


        const collector = message.createMessageComponentCollector({
            filter: (b) => {
                if (b.guild.members.me.voice.channel && b.guild.members.me.voice.channelId === b.member.voice.channelId)
                    return true;
                else {
                    b.reply({
                        content: `You are not connected to <#${b.guild.members.me.voice?.channelId ?? 'None'}> to use this buttons.`,
                        ephemeral: true,
                    });
                    return false;
                }
            },
            time: track.info.isStream ? 86400000 : track.info.length,
        });

        collector.on('collect', async (interaction) => {

            switch (interaction.customId) {
                case 'previous':
                    dispatcher.previous();
                    if (message) await message.edit({ embeds: [embed.setFooter({ text: `Previous by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL({ dynamic: true }) })], components: [button] });
                    break;
                case 'resume':
                    dispatcher.pause();
                    if (message) await message.edit({ embeds: [embed.setFooter({ text: `${player.paused ? 'Paused' : 'Resumed'} by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL({ dynamic: true }) })], components: [button] });
                    break;
                case 'stop':
                    dispatcher.stop();
                    if (message) await message.edit({ embeds: [embed.setFooter({ text: `Stopped by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL({ dynamic: true }) })], components: [button] });
                    break;
                case 'skip':
                    if (!dispatcher.queue.length > 0) {
                        return interaction.reply({ content: `There is no more song in the queue.`, ephemeral: true });
                    }
                    dispatcher.skip();
                    if (message) await message.edit({ embeds: [embed.setFooter({ text: `Skipped by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL({ dynamic: true }) })], components: [button] });
                    break;
                case 'loop':
                    switch (dispatcher.loop) {
                        case 'off':
                            dispatcher.loop = 'repeat';
                            if (message) await message.edit({ embeds: [embed.setFooter({ text: `Looping by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL({ dynamic: true }) })], components: [button] });
                            break;
                        case 'repeat':
                            dispatcher.loop = 'queue';
                            if (message) await message.edit({ embeds: [embed.setFooter({ text: `Looping Queue by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL({ dynamic: true }) })], components: [button] });
                            break;
                        case 'queue':
                            dispatcher.loop = 'off';
                            if (message) await message.edit({ embeds: [embed.setFooter({ text: `Looping Off by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL({ dynamic: true }) })], components: [button] });
                            break;
                    }
                    break;
            }
            await interaction.deferUpdate();
        });
        collector.on('end', async () => {
            if (message) await message.edit({ embeds: [embed.setFooter({ text: `Time out`, iconURL: interaction.user.avatarURL({ dynamic: true }) })], components: [button] });
        });

    }
}